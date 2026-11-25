import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCountry } from "@/lib/serializers";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const b = await req.json();

    const updated = await prisma.country.update({
      where: { id },
      data: {
        ...(b.name !== undefined ? { name: b.name } : {}),
        ...(b.flagEmoji !== undefined ? { flagEmoji: b.flagEmoji } : {}),
        ...(b.region !== undefined ? { region: b.region } : {}),
        ...(b.currencyCode !== undefined ? { currencyCode: String(b.currencyCode).toUpperCase() } : {}),
        ...(b.tagline !== undefined ? { tagline: b.tagline } : {}),
        ...(b.degreeLevels !== undefined ? { degreeLevels: JSON.stringify(b.degreeLevels) } : {}),
        ...(b.fieldsOfStudy !== undefined ? { fieldsOfStudy: JSON.stringify(b.fieldsOfStudy) } : {}),
        ...(b.tuitionMinAnnual !== undefined ? { tuitionMinAnnual: Number(b.tuitionMinAnnual) } : {}),
        ...(b.tuitionMaxAnnual !== undefined ? { tuitionMaxAnnual: Number(b.tuitionMaxAnnual) } : {}),
        ...(b.tuitionAvgAnnual !== undefined ? { tuitionAvgAnnual: Number(b.tuitionAvgAnnual) } : {}),
        ...(b.tuitionNotes !== undefined ? { tuitionNotes: b.tuitionNotes } : {}),
        ...(b.livingCostTiers !== undefined ? { livingCostTiers: JSON.stringify(b.livingCostTiers) } : {}),
        ...(b.proofOfFundsAmount !== undefined ? { proofOfFundsAmount: Number(b.proofOfFundsAmount) } : {}),
        ...(b.proofOfFundsStyle !== undefined ? { proofOfFundsStyle: b.proofOfFundsStyle } : {}),
        ...(b.proofOfFundsNotes !== undefined ? { proofOfFundsNotes: b.proofOfFundsNotes } : {}),
        ...(b.visaPredictability !== undefined ? { visaPredictability: b.visaPredictability } : {}),
        ...(b.visaType !== undefined ? { visaType: b.visaType } : {}),
        ...(b.embassyLocation !== undefined ? { embassyLocation: b.embassyLocation } : {}),
        ...(b.embassyBacklog !== undefined ? { embassyBacklog: b.embassyBacklog } : {}),
        ...(b.partTimeWageHourly !== undefined ? { partTimeWageHourly: Number(b.partTimeWageHourly) } : {}),
        ...(b.skilledWageHourly !== undefined ? { skilledWageHourly: Number(b.skilledWageHourly) } : {}),
        ...(b.workHoursCap !== undefined ? { workHoursCap: Number(b.workHoursCap) } : {}),
        ...(b.partTimeSustain !== undefined ? { partTimeSustain: b.partTimeSustain } : {}),
        ...(b.languageBarrier !== undefined ? { languageBarrier: b.languageBarrier } : {}),
        ...(b.stayBackMonths !== undefined ? { stayBackMonths: Number(b.stayBackMonths) } : {}),
        ...(b.prDifficulty !== undefined ? { prDifficulty: b.prDifficulty } : {}),
        ...(b.entrySalaryAnnual !== undefined ? { entrySalaryAnnual: Number(b.entrySalaryAnnual) } : {}),
        ...(b.purchasingPowerNote !== undefined ? { purchasingPowerNote: b.purchasingPowerNote } : {}),
        ...(b.pros !== undefined ? { pros: JSON.stringify(b.pros) } : {}),
        ...(b.cons !== undefined ? { cons: JSON.stringify(b.cons) } : {}),
        ...(b.groundReality !== undefined ? { groundReality: JSON.stringify(b.groundReality) } : {}),
        ...(b.legalizationSteps !== undefined ? { legalizationSteps: JSON.stringify(b.legalizationSteps) } : {}),
        ...(b.prPathwaySteps !== undefined ? { prPathwaySteps: JSON.stringify(b.prPathwaySteps) } : {}),
        ...(b.journeyTemplates !== undefined ? { journeyTemplates: JSON.stringify(b.journeyTemplates) } : {}),
        ...(b.isFeatured !== undefined ? { isFeatured: Boolean(b.isFeatured) } : {}),
      },
      include: { universities: { include: { programs: true } }, scholarships: true },
    });

    return NextResponse.json({ country: serializeCountry(updated) });
  } catch (error) {
    console.error("Admin update country error:", error);
    return NextResponse.json({ error: "Failed to update country" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.country.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
