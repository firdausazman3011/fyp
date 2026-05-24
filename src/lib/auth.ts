import { cookies, headers } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  AUTH_HEADER_EMAIL,
  AUTH_HEADER_NAME,
  AUTH_HEADER_PROFILE_PICTURE,
  AUTH_HEADER_ROLE,
  AUTH_HEADER_USER_ID,
} from "@/lib/auth-constants";
import { createAuthToken, verifyAuthToken, type AuthPayload } from "@/lib/auth-jwt";

export type { AuthPayload };
export { createAuthToken, verifyAuthToken, AUTH_COOKIE_NAME };

const TOKEN_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_AGE_SECONDS,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

function getAuthFromMiddlewareHeaders(headerStore: Headers): AuthPayload | null {
  const userId = headerStore.get(AUTH_HEADER_USER_ID);
  const role = headerStore.get(AUTH_HEADER_ROLE);
  const email = headerStore.get(AUTH_HEADER_EMAIL);

  if (!userId || !email || (role !== "USER" && role !== "ADMIN")) {
    return null;
  }

  const name = headerStore.get(AUTH_HEADER_NAME);
  const profilePicture = headerStore.get(AUTH_HEADER_PROFILE_PICTURE);

  return {
    userId,
    role,
    email,
    name: name && name.trim() ? name : "User",
    profilePicture: profilePicture && profilePicture.trim() ? profilePicture : null,
  };
}

/**
 * Returns the current user. Prefers claims set by middleware (no JWT re-verify).
 * Falls back to cookie verification for API routes and non-middleware paths.
 */
export async function getCurrentAuthUser(): Promise<AuthPayload | null> {
  const headerStore = await headers();
  const fromHeaders = getAuthFromMiddlewareHeaders(headerStore);
  if (fromHeaders) {
    return fromHeaders;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAuthToken(token);
}
