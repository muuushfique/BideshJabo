import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCountry } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const countries = await prisma.country.findMany({
    orderBy: { name: "asc" },
    include: {
      universities: { include: { programs: true } },
      scholarships: true,
    },
  });
  return NextResponse.json({ countries: countries.map(serializeCountry) });
}

export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const slug = String(b.slug || b.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    if (!slug || !b.name) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const created = await prisma.country.create({
      data: {
        slug,
        name: b.name,
        flagEmoji: b.flagEmoji || "🌍",
        region: b.region || "Europe",
        currencyCode: (b.currencyCode || "EUR").toUpperCase(),
        tagline: b.tagline || "",
        degreeLevels: JSON.stringify(b.degreeLevels || ["Bachelor's", "Master's", "PhD"]),
        fieldsOfStudy: JSON.stringify(b.fieldsOfStudy || ["Computer Science & IT", "Engineering"]),
        tuitionMinAnnual: Number(b.tuitionMinAnnual || 0),
        tuitionMaxAnnual: Number(b.tuitionMaxAnnual || 0),
        tuitionAvgAnnual: Number(b.tuitionAvgAnnual || 0),
        tuitionNotes: b.tuitionNotes || "",
        livingCostTiers: JSON.stringify(
          b.livingCostTiers || {
            frugal: { rent: 400, food: 250, transport: 50, utilities: 80, insurance: 50, misc: 100, total: 930 },
            balanced: { rent: 650, food: 350, transport: 70, utilities: 110, insurance: 60, misc: 160, total: 1400 },
            comfortable: { rent: 1000, food: 500, transport: 100, utilities: 150, insurance: 80, misc: 270, total: 2100 },
          }
        ),
        proofOfFundsAmount: Number(b.proofOfFundsAmount || 10000),
        proofOfFundsStyle: b.proofOfFundsStyle || "Standard Bank Statement",
        proofOfFundsNotes: b.proofOfFundsNotes || "",
        visaPredictability: b.visaPredictability || "Moderate",
        visaType: b.visaType || "Student Visa",
        embassyLocation: b.embassyLocation || "Dhaka",
        embassyBacklog: b.embassyBacklog || "Moderate",
        partTimeWageHourly: Number(b.partTimeWageHourly || 12),
        skilledWageHourly: Number(b.skilledWageHourly || 18),
        workHoursCap: Number(b.workHoursCap || 20),
        partTimeSustain: b.partTimeSustain || "Partial Only",
        languageBarrier: b.languageBarrier || "English-Friendly",
        stayBackMonths: Number(b.stayBackMonths || 12),
        prDifficulty: b.prDifficulty || "Moderate",
        entrySalaryAnnual: Number(b.entrySalaryAnnual || 35000),
        purchasingPowerNote: b.purchasingPowerNote || "",
        pros: JSON.stringify(b.pros || []),
        cons: JSON.stringify(b.cons || []),
        groundReality: JSON.stringify(
          b.groundReality || {
            housing: "",
            jobMarket: "",
            embassyWarning: "",
            bdCommunity: "",
            verdict: "",
          }
        ),
        legalizationSteps: JSON.stringify(b.legalizationSteps || []),
        prPathwaySteps: JSON.stringify(b.prPathwaySteps || []),
        journeyTemplates: JSON.stringify(b.journeyTemplates || []),
        isFeatured: Boolean(b.isFeatured),
      },
      include: { universities: { include: { programs: true } }, scholarships: true },
    });

    return NextResponse.json({ country: serializeCountry(created) });
  } catch (error) {
    console.error("Admin create country error:", error);
    return NextResponse.json({ error: "Failed to create country" }, { status: 500 });
  }
}
