import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeUniversity } from "@/lib/serializers";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const b = await req.json();

    if (Array.isArray(b.programs)) {
      await prisma.program.deleteMany({ where: { universityId: id } });
      await prisma.program.createMany({
        data: b.programs.map((p: Record<string, unknown>) => ({
          universityId: id,
          name: String(p.name || ""),
          degreeLevel: String(p.degreeLevel || "Master's"),
          field: String(p.field || "Computer Science & IT"),
          durationMonths: Number(p.durationMonths || 24),
          tuitionAnnual: Number(p.tuitionAnnual || 0),
          language: String(p.language || "English"),
          deadline: String(p.deadline || "March 15"),
          requirements: String(p.requirements || ""),
        })),
      });
    }

    const updated = await prisma.university.update({
      where: { id },
      data: {
        ...(b.name !== undefined ? { name: b.name } : {}),
        ...(b.city !== undefined ? { city: b.city } : {}),
        ...(b.type !== undefined ? { type: b.type } : {}),
        ...(b.qsRank !== undefined ? { qsRank: b.qsRank ? Number(b.qsRank) : null } : {}),
        ...(b.tuitionMin !== undefined ? { tuitionMin: Number(b.tuitionMin) } : {}),
        ...(b.tuitionMax !== undefined ? { tuitionMax: Number(b.tuitionMax) } : {}),
        ...(b.applicationFee !== undefined ? { applicationFee: Number(b.applicationFee) } : {}),
        ...(b.ieltsMin !== undefined ? { ieltsMin: Number(b.ieltsMin) } : {}),
        ...(b.greRequired !== undefined ? { greRequired: Boolean(b.greRequired) } : {}),
        ...(b.intakeDeadlines !== undefined ? { intakeDeadlines: JSON.stringify(b.intakeDeadlines) } : {}),
        ...(b.portalUrl !== undefined ? { portalUrl: b.portalUrl } : {}),
        ...(b.fundingNotes !== undefined ? { fundingNotes: b.fundingNotes } : {}),
      },
      include: { programs: true },
    });

    return NextResponse.json({ university: serializeUniversity(updated) });
  } catch (error) {
    console.error("Admin update university error:", error);
    return NextResponse.json({ error: "Failed to update university" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.university.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
