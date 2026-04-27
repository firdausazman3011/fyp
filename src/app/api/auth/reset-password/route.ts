import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { consumeResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema, toZodErrorMessage } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.parse({
      token: String(body.token ?? ""),
      password: String(body.password ?? ""),
    });

    const resetRecord = await consumeResetToken(parsed.token);
    if (!resetRecord) {
      return NextResponse.json({ error: "Reset link expired or invalid." }, { status: 400 });
    }

    const sameAsOld = await bcrypt.compare(parsed.password, resetRecord.user.passwordHash);
    if (sameAsOld) {
      return NextResponse.json(
        { error: "New password cannot be the same as old password." },
        { status: 400 },
      );
    }

    const newHash = await bcrypt.hash(parsed.password, 12);

    await prisma.user.update({
      where: { id: resetRecord.user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    const message = toZodErrorMessage(error);
    const status = message === "Invalid input." ? 500 : 400;

    return NextResponse.json(
      { error: status === 500 ? "Unable to reset password." : message },
      { status },
    );
  }
}
