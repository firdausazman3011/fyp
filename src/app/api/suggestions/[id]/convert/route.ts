import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { logAdminAction } from "@/lib/audit";
import { validateCsrfOrThrow } from "@/lib/security";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("ADMIN");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  const { id } = await params;
  const suggestion = await prisma.suggestion.findUnique({ where: { id } });
  if (!suggestion) return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
  if (suggestion.status !== SuggestionStatus.APPROVED) {
    return NextResponse.json({ error: "Only approved suggestions can be converted." }, { status: 400 });
  }
  if (suggestion.convertedToId || suggestion.convertedAt) {
    return NextResponse.json({ error: "Suggestion already converted." }, { status: 400 });
  }

  await logAdminAction(user.userId, "OPEN_CONVERT_SUGGESTION", "suggestion", id);
  revalidatePath("/admin/suggestions");
  return NextResponse.json({
    message: "Suggestion is ready to convert. Complete the activity form and click Save Activity to finalize conversion.",
  });
}
