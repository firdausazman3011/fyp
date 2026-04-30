import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { clearAuthCookie } from "@/lib/auth";
import { validateCsrfOrThrow } from "@/lib/security";
import { deleteAccountSchema, toZodErrorMessage } from "@/lib/validation";

export async function DELETE(request: Request) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = deleteAccountSchema.parse({
      password: String(body?.password ?? ""),
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, passwordHash: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const validPassword = await bcrypt.compare(parsed.password, dbUser.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 400 });
    }

  await prisma.user.delete({
    where: { id: user.userId },
  });

  await clearAuthCookie();

  return NextResponse.json({ message: "Account deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: toZodErrorMessage(error) }, { status: 400 });
  }
}
