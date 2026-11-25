import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeScholarship } from "@/lib/serializers";

export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const created = await prisma.scholarship.create({
      data: {
        countryId: b.countryId,
        name: b.name,
        provider: b.provider || "Government",
        degreeLevels: JSON.stringify(b.degreeLevels || ["Master's"]),
        coverageType: b.coverageType || "Full Tuition + Stipend",
        amountAnnual: Number(b.amountAnnual || 0),
        currencyCode: (b.currencyCode || "EUR").toUpperCase(),
        realisticOdds: b.realisticOdds || "Moderate",
        oddsExplanation: b.oddsExplanation || "",
        deadline: b.deadline || "March 15",
        eligibilitySummary: b.eligibilitySummary || "",
        url: b.url || "https://example.org",
      },
    });
    return NextResponse.json({ scholarship: serializeScholarship(created) });
  } catch (error) {
    console.error("Admin create scholarship error:", error);
    return NextResponse.json({ error: "Failed to create scholarship" }, { status: 500 });
  }
}
