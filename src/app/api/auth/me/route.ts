import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STUDENT_PROFILE, safeJsonParse } from "@/lib/serializers";
import type { StudentProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentProfile: safeJsonParse<StudentProfile>(
        user.studentProfile,
        DEFAULT_STUDENT_PROFILE
      ),
    },
  });
}
