import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonParse, serializeJourney } from "@/lib/serializers";
import type { JourneyTemplateItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ journeys: [] });

  const journeys = await prisma.userJourney.findMany({
    where: { userId: session.sub },
    include: { country: true, tasks: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ journeys: journeys.map(serializeJourney) });
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { countrySlug, targetIntake, degreeLevel } = (await req.json()) as {
      countrySlug: string;
      targetIntake?: string;
      degreeLevel?: string;
    };

    const country = await prisma.country.findUnique({ where: { slug: countrySlug } });
    if (!country) return NextResponse.json({ error: "Country not found" }, { status: 404 });

    const existing = await prisma.userJourney.findUnique({
      where: { userId_countryId: { userId: session.sub, countryId: country.id } },
      include: { country: true, tasks: true },
    });
    if (existing) {
      return NextResponse.json({ journey: serializeJourney(existing) });
    }

    const templates = safeJsonParse<JourneyTemplateItem[]>(country.journeyTemplates, []);
    const created = await prisma.userJourney.create({
      data: {
        userId: session.sub,
        countryId: country.id,
        targetIntake: targetIntake || "Fall 2027",
        degreeLevel: degreeLevel || "Master's",
        tasks: {
          create: templates.map((t, idx) => ({
            phase: t.phase,
            title: t.title,
            description: t.description || "",
            priority: t.priority || "Medium",
            subtasks: JSON.stringify(
              (t.subtasks || []).map((st, sIdx) => ({
                id: `sub-${idx}-${sIdx}`,
                title: st,
                done: false,
              }))
            ),
            sortOrder: idx,
            isCustom: false,
          })),
        },
      },
      include: { country: true, tasks: true },
    });

    return NextResponse.json({ journey: serializeJourney(created) });
  } catch (error) {
    console.error("POST /api/journeys error:", error);
    return NextResponse.json({ error: "Failed to initialize journey" }, { status: 500 });
  }
}
