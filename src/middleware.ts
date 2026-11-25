import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, USER_COOKIE_NAME, verifyJwt } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const userToken = request.cookies.get(USER_COOKIE_NAME)?.value;

    const adminPayload = await verifyJwt(adminToken);
    const userPayload = await verifyJwt(userToken);

    if (adminPayload?.role !== "ADMIN" && userPayload?.role !== "ADMIN") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
