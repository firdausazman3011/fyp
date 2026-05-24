import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";
import { parseActivityDateOnly, suggestionSchema, toZodErrorMessage, validationErrorResponse } from "@/lib/validation";
import { revalidateSuggestionRoutes } from "@/lib/revalidate-routes";

async function getOwnedSuggestion(userId: string, id: string) {
  return prisma.suggestion.findFirst({
    where: { id, submittedById: userId },
    include: { convertedTo: { select: { status: true } } },
  });
}

function blockedByLifecycle(suggestion: { status: string; convertedTo: { status: string } | null }) {
  return suggestion.status !== "PENDING" || suggestion.convertedTo?.status === "CANCELLED";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const existing = await getOwnedSuggestion(user.userId, id);
    if (!existing) return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
    if (blockedByLifecycle(existing)) {
      return NextResponse.json({ error: "This suggestion can no longer be edited." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = suggestionSchema.parse(body);

    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: {
        title: sanitizeText(parsed.title),
        description: sanitizeText(parsed.description),
        date: parseActivityDateOnly(parsed.date)!,
        location: sanitizeText(parsed.location),
      },
    });
    revalidateSuggestionRoutes();
    return NextResponse.json({ message: "Suggestion updated.", suggestion });
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) return validationResponse;
    return NextResponse.json({ error: toZodErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  const { id } = await params;
  const existing = await getOwnedSuggestion(user.userId, id);
  if (!existing) return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
  if (blockedByLifecycle(existing)) {
    return NextResponse.json({ error: "This suggestion can no longer be deleted." }, { status: 400 });
  }

  await prisma.suggestion.delete({ where: { id } });
  revalidateSuggestionRoutes();
  return NextResponse.json({ message: "Suggestion deleted." });
}
