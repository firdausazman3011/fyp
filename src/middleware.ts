import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_HEADER_EMAIL,
  AUTH_HEADER_NAME,
  AUTH_HEADER_PROFILE_PICTURE,
  AUTH_HEADER_ROLE,
  AUTH_HEADER_USER_ID,
} from "@/lib/auth-constants";
import { verifyAuthToken } from "@/lib/auth-jwt";

function forwardWithAuthHeaders(request: NextRequest, auth: NonNullable<Awaited<ReturnType<typeof verifyAuthToken>>>) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(AUTH_HEADER_USER_ID, auth.userId);
  requestHeaders.set(AUTH_HEADER_ROLE, auth.role);
  requestHeaders.set(AUTH_HEADER_EMAIL, auth.email);
  requestHeaders.set(AUTH_HEADER_NAME, auth.name);
  if (auth.profilePicture) {
    requestHeaders.set(AUTH_HEADER_PROFILE_PICTURE, auth.profilePicture);
  } else {
    requestHeaders.delete(AUTH_HEADER_PROFILE_PICTURE);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const auth = token ? await verifyAuthToken(token) : null;
  const role = auth?.role ?? null;
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

  if (!auth) {
    return NextResponse.next();
  }

  return forwardWithAuthHeaders(request, auth);
}

export const config = {
  matcher: ["/", "/home/:path*", "/activities/:path*", "/suggestions/:path*", "/admin/:path*"],
};
