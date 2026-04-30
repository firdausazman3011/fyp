import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ActivityStatus, SuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { logAdminAction } from "@/lib/audit";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";
import { DEFAULT_ACTIVITY_ORGANIZER } from "@/lib/constants";

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
  if (suggestion.convertedToId) {
    return NextResponse.json({ error: "Suggestion already converted." }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      title: sanitizeText(suggestion.title),
      description: sanitizeText(suggestion.description),
      date: suggestion.date,
      timeLabel: "09:00",
      durationMinutes: 120,
      participantLimit: 50,
      location: sanitizeText(suggestion.location),
      organizer: DEFAULT_ACTIVITY_ORGANIZER,
      imageUrl: "/uploads/default-activity.svg",
      status: ActivityStatus.PUBLISHED,
      createdByAdminId: user.userId,
    },
  });

  const updatedSuggestion = await prisma.suggestion.update({
    where: { id },
    data: {
      convertedAt: new Date(),
      convertedById: user.userId,
      convertedToId: activity.id,
    },
  });
  revalidatePath("/admin/suggestions");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/activities");
  revalidatePath("/activities");
  revalidatePath("/home");
  revalidatePath("/suggestions");

  await logAdminAction(user.userId, "CONVERT_SUGGESTION", "suggestion", id, activity.id);
  return NextResponse.json({ message: "Suggestion converted into activity.", suggestion: updatedSuggestion, activity });
}
