import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCookieOptions, signJwt, USER_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STUDENT_PROFILE, safeJsonParse } from "@/lib/serializers";
import type { StudentProfile } from "@/lib/types";

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid name, email, and password (6+ chars)." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        passwordHash,
        role: "USER",
        studentProfile: JSON.stringify(DEFAULT_STUDENT_PROFILE),
      },
    });

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "USER",
    });

    const res = NextResponse.json({
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
    res.cookies.set(USER_COOKIE_NAME, token, getCookieOptions());
    return res;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
