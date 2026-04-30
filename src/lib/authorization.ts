import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth";

export async function requireAuth() {
  const user = await getCurrentAuthUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Access denied." }, { status: 401 }) };
  }
  return { user, response: null };
}

export async function requireRole(role: "USER" | "ADMIN") {
  const { user, response } = await requireAuth();
  if (response || !user) return { user: null, response };
  if (user.role !== role) {
    return { user: null, response: NextResponse.json({ error: "Access denied." }, { status: 403 }) };
  }
  return { user, response: null };
}
