import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "uniconnect_csrf";

export function sanitizeText(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function ensureCsrfCookie() {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return token;
}

export async function validateCsrfOrThrow() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const requestToken = headerStore.get("x-csrf-token");

  if (!cookieToken || !requestToken || cookieToken !== requestToken) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return null;
}
