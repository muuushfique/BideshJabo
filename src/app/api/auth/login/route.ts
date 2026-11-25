import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getCookieOptions, signJwt, USER_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STUDENT_PROFILE, safeJsonParse } from "@/lib/serializers";
import type { StudentProfile } from "@/lib/types";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password format" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const role = user.role === "ADMIN" ? "ADMIN" : "USER";
    const token = await signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      role,
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
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
