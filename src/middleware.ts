import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

async function decodeRole(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === "ADMIN" || payload.role === "USER" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("uniconnect_auth")?.value;
  const role = token ? await decodeRole(token) : null;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL(role === "USER" ? "/home" : "/login", request.url));
    }
  }

  if (pathname.startsWith("/home") || pathname.startsWith("/activities") || pathname.startsWith("/suggestions")) {
    if (role !== "USER") {
      return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin/dashboard" : "/login", request.url));
    }
  }

  if (pathname === "/" && role) {
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin/dashboard" : "/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/home/:path*", "/activities/:path*", "/suggestions/:path*", "/admin/:path*"],
};
