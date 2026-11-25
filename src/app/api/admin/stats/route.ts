import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [countries, universities, programs, scholarships, users, journeys, exchangeRates] =
    await Promise.all([
      prisma.country.count(),
      prisma.university.count(),
      prisma.program.count(),
      prisma.scholarship.count(),
      prisma.user.count(),
      prisma.userJourney.count(),
      prisma.exchangeRate.count(),
    ]);

  return NextResponse.json({
    stats: {
      countries,
      universities,
      programs,
      scholarships,
      users,
      journeys,
      exchangeRates,
    },
  });
}
