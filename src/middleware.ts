import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { SessionPayload } from "@/types";

const COOKIE_NAME = "e_lpj_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "e-lpj-hibah-internal-super-secret-key-32chars-min"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let session: SessionPayload | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload as unknown as SessionPayload;
    } catch {
      session = null;
    }
  }

  // 1. Root redirect logic
  if (pathname === "/") {
    if (session) {
      const target = session.role === "ADMIN" ? "/admin" : "/user";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Already authenticated user visiting /login or /register
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (session) {
      const target = session.role === "ADMIN" ? "/admin" : "/user";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 3. Protected route: Admin (Super Admin / Verifikator)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "ADMIN") {
      // Recipient cannot access admin portal
      return NextResponse.redirect(new URL("/user", request.url));
    }
    return NextResponse.next();
  }

  // 4. Protected route: User (Penerima Hibah)
  if (pathname.startsWith("/user")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "USER") {
      // Admin redirected to their respective dashboard
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/admin/:path*",
    "/user/:path*",
  ],
};
