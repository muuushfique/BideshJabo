import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCountry } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      include: {
        universities: { include: { programs: true }, orderBy: { qsRank: "asc" } },
        scholarships: true,
      },
    });
    return NextResponse.json({ countries: countries.map(serializeCountry) });
  } catch (error) {
    console.error("GET /api/countries error:", error);
    return NextResponse.json({ error: "Failed to load countries" }, { status: 500 });
  }
}
