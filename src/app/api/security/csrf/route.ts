import { NextResponse } from "next/server";
import { ensureCsrfCookie } from "@/lib/security";

export async function GET() {
  const token = await ensureCsrfCookie();
  return NextResponse.json({ token });
}
