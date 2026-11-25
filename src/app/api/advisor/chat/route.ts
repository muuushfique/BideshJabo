import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { buildGroundedAdvice, scoreCountriesForProfile } from "@/lib/advisor-engine";
import { buildRateMap, convertToBdt, formatBdt, formatLocalCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STUDENT_PROFILE, serializeCountry } from "@/lib/serializers";
import type { ActionableCard, StudentProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

function sseEvent(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages?: { role: "user" | "assistant"; content: string }[];
      profile?: StudentProfile;
    };

    const messages = body.messages ?? [];
    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content ||
      "Recommend the best study abroad countries for my profile and budget.";
    const profile: StudentProfile = {
      ...DEFAULT_STUDENT_PROFILE,
      ...(body.profile || {}),
    };

    const [ratesRaw, countriesRaw] = await Promise.all([
      prisma.exchangeRate.findMany(),
      prisma.country.findMany({
        include: {
          universities: { include: { programs: true } },
          scholarships: true,
        },
      }),
    ]);

    const rates = ratesRaw.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      symbol: r.symbol,
      rateToBdt: r.rateToBdt,
    }));
    const rateMap = buildRateMap(rates);
    const countries = countriesRaw.map(serializeCountry);

    const scored = scoreCountriesForProfile(countries, profile, rateMap, lastUserMessage);
    const topMatches = scored.slice(0, 3);
    const recommendedCards: ActionableCard[] = topMatches.map((m) => ({
      type: "country",
      slug: m.country.slug,
      title: `${m.country.flagEmoji} ${m.country.name}`,
      subtitle: `${m.country.visaPredictability} Visa • ${m.country.stayBackMonths} mo Stay-Back • ${m.country.proofOfFundsStyle}`,
      highlight: `Avg Tuition ${formatLocalCurrency(m.country.tuitionAvgAnnual, m.country.currencyCode, rateMap)}/yr`,
      currencyCode: m.country.currencyCode,
      amountLocal: m.country.tuitionAvgAnnual,
      visaBadge: m.country.visaPredictability,
    }));

    if (topMatches[0]?.country.universities?.[0]) {
      const u = topMatches[0].country.universities[0];
      const c = topMatches[0].country;
      recommendedCards.push({
        type: "university",
        slug: u.slug,
        countrySlug: c.slug,
        title: u.name,
        subtitle: `${u.city}, ${c.name} • IELTS ${u.ieltsMin}+`,
        highlight: `Tuition from ${formatLocalCurrency(u.tuitionMin, c.currencyCode, rateMap)}/yr`,
        currencyCode: c.currencyCode,
        amountLocal: u.tuitionMin,
      });
    }

    const dbContext = countries
      .map((c) => {
        const tier = c.livingCostTiers[profile.preferredLifestyle || "balanced"];
        const tuitionBdt = convertToBdt(c.tuitionAvgAnnual, c.currencyCode, rateMap);
        const pofBdt = convertToBdt(c.proofOfFundsAmount, c.currencyCode, rateMap);
        const livingBdt = convertToBdt(tier.total, c.currencyCode, rateMap);
        const unis = (c.universities || [])
          .map((u) => `${u.name} (${u.city}, IELTS ${u.ieltsMin}, ${formatLocalCurrency(u.tuitionMin, c.currencyCode, rateMap)}-${formatLocalCurrency(u.tuitionMax, c.currencyCode, rateMap)})`)
          .join("; ");
        return [
          `COUNTRY: ${c.name} (${c.slug}) | Currency: ${c.currencyCode}`,
          `Tuition Avg: ${formatLocalCurrency(c.tuitionAvgAnnual, c.currencyCode, rateMap)} (${formatBdt(tuitionBdt)}) | Notes: ${c.tuitionNotes}`,
          `Living (${profile.preferredLifestyle}): ${formatLocalCurrency(tier.total, c.currencyCode, rateMap)}/mo (${formatBdt(livingBdt)}/mo)`,
          `POF: ${formatLocalCurrency(c.proofOfFundsAmount, c.currencyCode, rateMap)} (${formatBdt(pofBdt)}) via ${c.proofOfFundsStyle}`,
          `Visa: ${c.visaPredictability}, Backlog: ${c.embassyBacklog}, Work cap: ${c.workHoursCap} hrs/wk @ ${formatLocalCurrency(c.partTimeWageHourly, c.currencyCode, rateMap)}/hr`,
          `Stay-back: ${c.stayBackMonths} months | PR: ${c.prDifficulty}`,
          `Ground Reality: ${c.groundReality.verdict} | Warning: ${c.groundReality.embassyWarning}`,
          `Universities: ${unis}`,
        ].join("\n");
      })
      .join("\n\n");

    const systemPrompt = `You are BideshJabo AI Advisor — an honest, data-driven study abroad strategist built specifically for Bangladeshi and international students.
Always show EVERY monetary amount in BOTH local currency AND BDT equivalent using the exact numbers from the database context below.
Student Profile:
- Degree Target: ${profile.degreeTarget}
- CGPA: ${profile.cgpa}
- Major: ${profile.major}
- Work Experience: ${profile.workExperienceYears} years
- Total Budget: ${formatBdt(profile.budgetBdt, "exact")}
- IELTS: ${profile.ieltsScore}
- Preferred Lifestyle: ${profile.preferredLifestyle}
- Target Intake: ${profile.targetIntake}

Be concise, structured with markdown headings/bullets, honest about ground realities (embassy backlogs, housing crises, work caps), and actionable.

LIVE DATABASE CONTEXT:
${dbContext}`;

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (geminiKey) {
            controller.enqueue(sseEvent({ type: "meta", mode: "gemini" }));
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const historyText = messages
              .slice(-6)
              .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
              .join("\n\n");
            const responseStream = await ai.models.generateContentStream({
              model: "gemini-2.5-flash",
              contents: `${systemPrompt}\n\nCONVERSATION:\n${historyText}`,
            });
            for await (const chunk of responseStream) {
              if (chunk.text) {
                controller.enqueue(sseEvent({ type: "text", content: chunk.text }));
              }
            }
            controller.enqueue(sseEvent({ type: "cards", cards: recommendedCards }));
            controller.enqueue(sseEvent({ type: "done" }));
            controller.close();
            return;
          }

          if (openaiKey) {
            controller.enqueue(sseEvent({ type: "meta", mode: "openai" }));
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                stream: true,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...messages.slice(-8),
                ],
              }),
            });

            if (res.ok && res.body) {
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let buf = "";
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() || "";
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) {
                      controller.enqueue(sseEvent({ type: "text", content: delta }));
                    }
                  } catch {
                    // ignore partial SSE chunks
                  }
                }
              }
              controller.enqueue(sseEvent({ type: "cards", cards: recommendedCards }));
              controller.enqueue(sseEvent({ type: "done" }));
              controller.close();
              return;
            }
          }

          // Grounded local database intelligence streaming fallback
          controller.enqueue(sseEvent({ type: "meta", mode: "local-intelligence" }));
          const grounded = buildGroundedAdvice(
            lastUserMessage,
            countries,
            profile,
            rateMap
          );
          const tokens = grounded.text.split(/(\s+)/);
          for (let i = 0; i < tokens.length; i += 4) {
            const chunk = tokens.slice(i, i + 4).join("");
            controller.enqueue(sseEvent({ type: "text", content: chunk }));
            await new Promise((r) => setTimeout(r, 14));
          }
          controller.enqueue(sseEvent({ type: "cards", cards: grounded.cards }));
          controller.enqueue(sseEvent({ type: "done" }));
          controller.close();
        } catch (err) {
          console.error("Advisor stream error:", err);
          const grounded = buildGroundedAdvice(
            lastUserMessage,
            countries,
            profile,
            rateMap
          );
          controller.enqueue(sseEvent({ type: "meta", mode: "local-intelligence" }));
          controller.enqueue(sseEvent({ type: "text", content: grounded.text }));
          controller.enqueue(sseEvent({ type: "cards", cards: grounded.cards }));
          controller.enqueue(sseEvent({ type: "done" }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("POST /api/advisor/chat error:", error);
    return NextResponse.json({ error: "Advisor request failed" }, { status: 500 });
  }
}
