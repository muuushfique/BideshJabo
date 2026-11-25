import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCountry } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const country = await prisma.country.findUnique({
      where: { slug },
      include: {
        universities: { include: { programs: true }, orderBy: { qsRank: "asc" } },
        scholarships: true,
      },
    });
    if (!country) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }
    return NextResponse.json({ country: serializeCountry(country) });
  } catch (error) {
    console.error("GET /api/countries/[slug] error:", error);
    return NextResponse.json({ error: "Failed to load country" }, { status: 500 });
  }
}
