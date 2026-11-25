import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const USER_COOKIE_NAME = "bideshjabo_session";
export const ADMIN_COOKIE_NAME = "bideshjabo_admin";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "bideshjabo-local-dev-secret-change-in-production-2026";
  return new TextEncoder().encode(secret);
}

export async function signJwt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifyJwt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.email) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name ?? "Student"),
      role: payload.role === "ADMIN" ? "ADMIN" : "USER",
    };
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(USER_COOKIE_NAME)?.value;
  return verifyJwt(token);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const adminToken = store.get(ADMIN_COOKIE_NAME)?.value;
  const adminPayload = await verifyJwt(adminToken);
  if (adminPayload?.role === "ADMIN") return adminPayload;

  const userToken = store.get(USER_COOKIE_NAME)?.value;
  const userPayload = await verifyJwt(userToken);
  if (userPayload?.role === "ADMIN") return userPayload;
  return null;
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
