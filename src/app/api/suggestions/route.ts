import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseActivityDateOnly, suggestionSchema, toZodErrorMessage, validationErrorResponse } from "@/lib/validation";
import { requireAuth, requireRole } from "@/lib/authorization";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";

export async function GET() {
  const { user, response } = await requireAuth();
  if (response || !user) return response;

  if (user.role === "ADMIN") {
    const suggestions = await prisma.suggestion.findMany({
      orderBy: { submittedAt: "desc" },
      include: { submittedBy: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ suggestions });
  }

  const suggestions = await prisma.suggestion.findMany({
    where: { submittedById: user.userId },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ suggestions });
}

export async function POST(request: Request) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = suggestionSchema.parse(body);

    const suggestion = await prisma.suggestion.create({
      data: {
        title: sanitizeText(parsed.title),
        description: sanitizeText(parsed.description),
        date: parseActivityDateOnly(parsed.date)!,
        location: sanitizeText(parsed.location),
        submittedById: user.userId,
      },
    });

    return NextResponse.json({ message: "Suggestion submitted successfully.", suggestion }, { status: 201 });
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) return validationResponse;
    return NextResponse.json({ error: toZodErrorMessage(error) }, { status: 400 });
  }
}
