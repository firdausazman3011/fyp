import { NextResponse } from "next/server";

import { createResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { validateCsrfOrThrow } from "@/lib/security";
import { forgotPasswordSchema, toZodErrorMessage } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const csrfError = await validateCsrfOrThrow();
    if (csrfError) return csrfError;

    const body = await request.json();
    const parsed = forgotPasswordSchema.parse({
      email: String(body.email ?? "").toLowerCase(),
    });

    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!user) {
      return NextResponse.json({ message: "If the account exists, a reset link has been sent." });
    }

    const rawToken = await createResetToken(user.id);
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({ message: "If the account exists, a reset link has been sent." });
  } catch (error) {
    const message = toZodErrorMessage(error);
    const status = message === "Invalid input." ? 500 : 400;

    return NextResponse.json(
      { error: status === 500 ? "Unable to process request." : message },
      { status },
    );
  }
}
