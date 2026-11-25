import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_STUDENT_PROFILE,
  safeJsonParse,
  serializeCountry,
  serializeJourney,
} from "@/lib/serializers";
import type { ChatMessage, FinancialItemDTO, FinancialPlanDTO, StudentProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rates, countries, session] = await Promise.all([
      prisma.exchangeRate.findMany({ orderBy: { code: "asc" } }),
      prisma.country.findMany({
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        include: {
          universities: {
            include: { programs: true },
            orderBy: { qsRank: "asc" },
          },
          scholarships: true,
        },
      }),
      getCurrentSession(),
    ]);

    let userPayload = null;
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
        include: {
          savedItems: true,
          researchNotes: { include: { country: true } },
          journeys: { include: { country: true, tasks: true } },
          financialPlans: { include: { items: true }, take: 1 },
          chatSessions: { orderBy: { updatedAt: "desc" }, take: 1 },
        },
      });

      if (user) {
        const plan = user.financialPlans[0];
        const financialPlan: FinancialPlanDTO | null = plan
          ? {
              id: plan.id,
              name: plan.name,
              targetCountrySlug: plan.targetCountrySlug,
              totalBudgetBdt: plan.totalBudgetBdt,
              pofTargetBdt: plan.pofTargetBdt,
              seasoningStart: plan.seasoningStart,
              seasoningDaysReq: plan.seasoningDaysReq,
              items: plan.items.map(
                (i): FinancialItemDTO => ({
                  id: i.id,
                  category: i.category === "POF_SOURCE" ? "POF_SOURCE" : "UPFRONT",
                  label: i.label,
                  amount: i.amount,
                  currencyCode: i.currencyCode,
                  isPaid: i.isPaid,
                  notes: i.notes,
                })
              ),
            }
          : null;

        const countrySlugMap = new Map(countries.map((c) => [c.id, c.slug]));
        const uniSlugMap = new Map(
          countries.flatMap((c) => c.universities.map((u) => [u.id, u.slug]))
        );

        const shortlistCountries = user.savedItems
          .filter((s) => s.itemType === "COUNTRY")
          .map((s) => countrySlugMap.get(s.itemId) || s.itemId);

        const shortlistUniversities = user.savedItems
          .filter((s) => s.itemType === "UNIVERSITY")
          .map((s) => uniSlugMap.get(s.itemId) || s.itemId);

        const researchNotes: Record<string, string> = {};
        for (const note of user.researchNotes) {
          researchNotes[note.country.slug] = note.content;
        }

        userPayload = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            studentProfile: safeJsonParse<StudentProfile>(
              user.studentProfile,
              DEFAULT_STUDENT_PROFILE
            ),
          },
          shortlistCountries,
          shortlistUniversities,
          researchNotes,
          journeys: user.journeys.map(serializeJourney),
          financialPlan,
          chatMessages: user.chatSessions[0]
            ? safeJsonParse<ChatMessage[]>(user.chatSessions[0].messages, [])
            : [],
        };
      }
    }

    return NextResponse.json({
      exchangeRates: rates.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        symbol: r.symbol,
        rateToBdt: r.rateToBdt,
        updatedAt: r.updatedAt.toISOString(),
      })),
      countries: countries.map(serializeCountry),
      workspace: userPayload,
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    return NextResponse.json({ error: "Failed to load platform data" }, { status: 500 });
  }
}
