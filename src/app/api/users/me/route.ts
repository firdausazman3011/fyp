import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { profileUpdateSchema, toZodErrorMessage } from "@/lib/validation";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";

export async function PATCH(request: Request) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        name: sanitizeText(parsed.name),
        profilePicture: parsed.profilePicture?.trim() ? parsed.profilePicture.trim() : null,
      },
      select: {
        name: true,
        email: true,
        profilePicture: true,
      },
    });

    return NextResponse.json({ message: "Profile updated successfully.", user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: toZodErrorMessage(error) }, { status: 400 });
  }
}
