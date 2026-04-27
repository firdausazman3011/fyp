import { NextResponse } from "next/server";

import { createResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema, toZodErrorMessage } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.parse({
      email: String(body.email ?? "").toLowerCase(),
    });

    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!user) {
      return NextResponse.json({ error: "Email not registered." }, { status: 404 });
    }

    const rawToken = await createResetToken(user.id);
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({ message: "Password reset link sent. Please check your email." });
  } catch (error) {
    const message = toZodErrorMessage(error);
    const status = message === "Invalid input." ? 500 : 400;

    return NextResponse.json(
      { error: status === 500 ? "Unable to process request." : message },
      { status },
    );
  }
}
