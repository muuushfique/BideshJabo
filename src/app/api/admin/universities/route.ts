import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeUniversity } from "@/lib/serializers";

export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    const slug =
      String(b.slug || b.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6);

    const created = await prisma.university.create({
      data: {
        countryId: b.countryId,
        slug: b.slug ? String(b.slug) : slug,
        name: b.name,
        city: b.city || "",
        type: b.type || "Public",
        qsRank: b.qsRank ? Number(b.qsRank) : null,
        tuitionMin: Number(b.tuitionMin || 0),
        tuitionMax: Number(b.tuitionMax || 0),
        applicationFee: Number(b.applicationFee || 0),
        ieltsMin: Number(b.ieltsMin || 6.5),
        toeflMin: b.toeflMin ? Number(b.toeflMin) : null,
        greRequired: Boolean(b.greRequired),
        intakeDeadlines: JSON.stringify(b.intakeDeadlines || { fall: "March 15" }),
        portalUrl: b.portalUrl || "https://example.edu",
        fundingNotes: b.fundingNotes || "",
        englishPrograms: b.englishPrograms !== false,
        programs: {
          create: (b.programs || []).map((p: Record<string, unknown>) => ({
            name: String(p.name || "M.Sc. Computer Science"),
            degreeLevel: String(p.degreeLevel || "Master's"),
            field: String(p.field || "Computer Science & IT"),
            durationMonths: Number(p.durationMonths || 24),
            tuitionAnnual: Number(p.tuitionAnnual || 0),
            language: String(p.language || "English"),
            deadline: String(p.deadline || "March 15"),
            requirements: String(p.requirements || "Bachelor's degree, IELTS 6.5"),
          })),
        },
      },
      include: { programs: true },
    });

    return NextResponse.json({ university: serializeUniversity(created) });
  } catch (error) {
    console.error("Admin create university error:", error);
    return NextResponse.json({ error: "Failed to create university" }, { status: 500 });
  }
}
