import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ADMIN_COOKIE_NAME, getCookieOptions, signJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const targetEmail = (process.env.ADMIN_EMAIL || "admin@bideshjabo.com").toLowerCase();
    const targetPassword = process.env.ADMIN_PASSWORD || "BideshJaboAdmin2026!";

    const normalizedEmail = (email || "").toLowerCase().trim();
    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    let isAuthorized = normalizedEmail === targetEmail && password === targetPassword;

    if (!isAuthorized) {
      const adminUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (adminUser?.role === "ADMIN") {
        isAuthorized = await bcrypt.compare(password, adminUser.passwordHash);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Invalid administrator credentials" }, { status: 401 });
    }

    const token = await signJwt({
      sub: "admin",
      email: normalizedEmail,
      name: "BideshJabo Admin",
      role: "ADMIN",
    });

    const res = NextResponse.json({ ok: true, email: normalizedEmail });
    res.cookies.set(ADMIN_COOKIE_NAME, token, getCookieOptions());
    return res;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Admin login failed" }, { status: 500 });
  }
}
