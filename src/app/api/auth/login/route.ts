import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, toZodErrorMessage } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse({
      email: String(body.email ?? "").toLowerCase(),
      password: String(body.password ?? ""),
    });

    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({ role: user.role, email: user.email });
  } catch (error) {
    const message = toZodErrorMessage(error);
    const status = message === "Invalid input." ? 500 : 400;

    return NextResponse.json(
      { error: status === 500 ? "Unable to login." : message },
      { status },
    );
  }
}
