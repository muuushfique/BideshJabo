import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeScholarship } from "@/lib/serializers";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const b = await req.json();
    const updated = await prisma.scholarship.update({
      where: { id },
      data: {
        ...(b.name !== undefined ? { name: b.name } : {}),
        ...(b.provider !== undefined ? { provider: b.provider } : {}),
        ...(b.degreeLevels !== undefined ? { degreeLevels: JSON.stringify(b.degreeLevels) } : {}),
        ...(b.coverageType !== undefined ? { coverageType: b.coverageType } : {}),
        ...(b.amountAnnual !== undefined ? { amountAnnual: Number(b.amountAnnual) } : {}),
        ...(b.currencyCode !== undefined ? { currencyCode: String(b.currencyCode).toUpperCase() } : {}),
        ...(b.realisticOdds !== undefined ? { realisticOdds: b.realisticOdds } : {}),
        ...(b.oddsExplanation !== undefined ? { oddsExplanation: b.oddsExplanation } : {}),
        ...(b.deadline !== undefined ? { deadline: b.deadline } : {}),
        ...(b.eligibilitySummary !== undefined ? { eligibilitySummary: b.eligibilitySummary } : {}),
        ...(b.url !== undefined ? { url: b.url } : {}),
      },
    });
    return NextResponse.json({ scholarship: serializeScholarship(updated) });
  } catch (error) {
    console.error("Admin update scholarship error:", error);
    return NextResponse.json({ error: "Failed to update scholarship" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.scholarship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
