import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeJourney } from "@/lib/serializers";
import type { JourneyTaskDTO } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const journey = await prisma.userJourney.findFirst({
      where: { id, userId: session.sub },
    });
    if (!journey) return NextResponse.json({ error: "Journey not found" }, { status: 404 });

    const body = (await req.json()) as {
      targetIntake?: string;
      degreeLevel?: string;
      tasks?: JourneyTaskDTO[];
    };

    if (body.tasks) {
      await prisma.journeyTask.deleteMany({ where: { journeyId: id } });
      await prisma.journeyTask.createMany({
        data: body.tasks.map((t, idx) => ({
          journeyId: id,
          phase: t.phase,
          title: t.title,
          description: t.description || "",
          isCompleted: Boolean(t.isCompleted),
          priority: t.priority || "Medium",
          dueDate: t.dueDate || null,
          subtasks: JSON.stringify(t.subtasks || []),
          sortOrder: t.sortOrder ?? idx,
          isCustom: Boolean(t.isCustom),
        })),
      });
    }

    const updated = await prisma.userJourney.update({
      where: { id },
      data: {
        targetIntake: body.targetIntake ?? journey.targetIntake,
        degreeLevel: body.degreeLevel ?? journey.degreeLevel,
      },
      include: { country: true, tasks: true },
    });

    return NextResponse.json({ journey: serializeJourney(updated) });
  } catch (error) {
    console.error("PUT /api/journeys/[id] error:", error);
    return NextResponse.json({ error: "Failed to update journey" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.userJourney.deleteMany({ where: { id, userId: session.sub } });
  return NextResponse.json({ ok: true });
}
