import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authorization";
import { changePasswordSchema, fieldErrorResponse, toZodErrorMessage, validationErrorResponse } from "@/lib/validation";
import { validateCsrfOrThrow } from "@/lib/security";

export async function POST(request: Request) {
  const { user, response } = await requireAuth();
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.parse(body);

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ error: "Access denied." }, { status: 401 });
    }

    const validCurrent = await bcrypt.compare(parsed.currentPassword, dbUser.passwordHash);
    if (!validCurrent) {
      return fieldErrorResponse({ currentPassword: "Current password is incorrect." });
    }

    const sameAsOld = await bcrypt.compare(parsed.newPassword, dbUser.passwordHash);
    if (sameAsOld) {
      return fieldErrorResponse({ newPassword: "New password cannot be the same as your current password." });
    }

    const passwordHash = await bcrypt.hash(parsed.newPassword, 12);
    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash },
    });

    return NextResponse.json({ message: "Password changed successfully." });
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) return validationResponse;
    return NextResponse.json({ error: toZodErrorMessage(error) }, { status: 400 });
  }
}
