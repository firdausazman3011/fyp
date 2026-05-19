import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { changeEmailSchema, fieldErrorResponse, toZodErrorMessage, validationErrorResponse } from "@/lib/validation";
import { validateCsrfOrThrow } from "@/lib/security";
import { createAdminEmailChangeToken } from "@/lib/admin-email-change";
import { sendAdminEmailVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { user, response } = await requireRole("ADMIN");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = changeEmailSchema.parse({
      email: String(body.email ?? "").toLowerCase(),
    });
    const currentPassword = String(body.currentPassword ?? "");
    if (!currentPassword) {
      return fieldErrorResponse({ currentPassword: "Current password is required." });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return NextResponse.json({ error: "Access denied." }, { status: 401 });
    }
    const validCurrent = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!validCurrent) {
      return fieldErrorResponse({ currentPassword: "Current password is incorrect." });
    }
    if (dbUser.email.toLowerCase() === parsed.email.toLowerCase()) {
      return fieldErrorResponse({ email: "New email must be different from current email." });
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
      select: { id: true },
    });
    if (existing && existing.id !== user.userId) {
      return fieldErrorResponse({ email: "This email is already in use." });
    }

    const rawToken = await createAdminEmailChangeToken(user.userId, parsed.email);
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const verifyUrl = `${appUrl}/api/users/me/email/verify?token=${rawToken}`;
    await sendAdminEmailVerificationEmail(parsed.email, verifyUrl);

    return NextResponse.json({
      message: "Verification link sent to the new email. Please verify to complete the update.",
    });
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) return validationResponse;
    return NextResponse.json({ error: toZodErrorMessage(error) }, { status: 400 });
  }
}
