import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { logAdminAction } from "@/lib/audit";
import { reviewSuggestionSchema, toZodErrorMessage } from "@/lib/validation";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("ADMIN");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = reviewSuggestionSchema.parse(body);

    const suggestion = await prisma.suggestion.findUnique({ where: { id } });
    if (!suggestion) return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
    if (suggestion.status !== SuggestionStatus.PENDING) {
      return NextResponse.json({ error: "Only pending suggestions can be reviewed." }, { status: 400 });
    }

    const updated = await prisma.suggestion.update({
      where: { id },
      data: {
        status: parsed.status,
        adminRemark: parsed.adminRemark ? sanitizeText(parsed.adminRemark) : null,
      },
    });
    revalidatePath("/admin/suggestions");
    revalidatePath("/admin/dashboard");
    revalidatePath("/suggestions");
    revalidatePath("/home");
    await logAdminAction(user.userId, "REVIEW_SUGGESTION", "suggestion", id, parsed.status);
    return NextResponse.json({ message: "Suggestion updated.", suggestion: updated });
  } catch (error) {
    const message = toZodErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
