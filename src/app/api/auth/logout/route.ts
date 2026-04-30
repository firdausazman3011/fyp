import { NextResponse } from "next/server";

import { clearAuthCookie } from "@/lib/auth";
import { validateCsrfOrThrow } from "@/lib/security";

export async function POST() {
  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  await clearAuthCookie();
  return NextResponse.json({ message: "Logged out" });
}
