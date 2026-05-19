import { NextResponse } from "next/server";
import { ActivityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createActivitySchema, parseActivityDateOnly, toZodErrorMessage, validationErrorResponse } from "@/lib/validation";
import { requireAuth, requireRole } from "@/lib/authorization";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";
import { activityScheduleOverlaps } from "@/lib/activity-time";
import { getTodayDateOnly } from "@/lib/date-only";
import { serializeActivityDate } from "@/lib/date-format";

export async function GET() {
  const { user, response } = await requireAuth();
  if (response || !user) return response;

  const where =
    user.role === "USER"
      ? { status: ActivityStatus.PUBLISHED, date: { gte: getTodayDateOnly() } }
      : undefined;

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: "asc" },
    include: { participants: true },
  });

  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const { user, response } = await requireRole("ADMIN");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = createActivitySchema.parse(body);
    const sourceSuggestionId =
      typeof body.sourceSuggestionId === "string" && body.sourceSuggestionId.trim().length > 0
        ? body.sourceSuggestionId.trim()
        : null;
    const activityDate = parseActivityDateOnly(parsed.date);
    if (!activityDate) {
      return NextResponse.json({ error: "Invalid date/time." }, { status: 400 });
    }

    const sameDayActivities = await prisma.activity.findMany({
      where: {
        date: activityDate,
        status: { not: ActivityStatus.CANCELLED },
      },
      select: { date: true, timeLabel: true, durationMinutes: true },
    });
    const hasOverlap = sameDayActivities.some((existing) =>
      activityScheduleOverlaps(
        activityDate,
        parsed.time,
        parsed.durationMinutes,
        existing.date,
        existing.timeLabel,
        existing.durationMinutes,
      ),
    );
    if (hasOverlap) {
      return NextResponse.json(
        { error: "Activity schedule overlaps with another activity on the same date." },
        { status: 400 },
      );
    }

    const activity = await prisma.activity.create({
      data: {
        title: sanitizeText(parsed.title),
        description: sanitizeText(parsed.description),
        date: activityDate,
        timeLabel: parsed.time,
        durationMinutes: parsed.durationMinutes,
        participantLimit: parsed.participantLimit,
        location: sanitizeText(parsed.location),
        organizer: sanitizeText(parsed.organizer),
        imageUrl: parsed.imageUrl.trim(),
        status: parsed.status,
        createdByAdminId: user.userId,
      },
    });

    if (sourceSuggestionId) {
      const sourceSuggestion = await prisma.suggestion.findUnique({ where: { id: sourceSuggestionId } });
      if (
        !sourceSuggestion
        || sourceSuggestion.status !== "APPROVED"
        || sourceSuggestion.convertedToId
        || sourceSuggestion.convertedAt
      ) {
        await prisma.activity.delete({ where: { id: activity.id } });
        return NextResponse.json({ error: "Suggestion is not available for conversion." }, { status: 400 });
      }
      await prisma.suggestion.update({
        where: { id: sourceSuggestionId },
        data: {
          convertedAt: new Date(),
          convertedById: user.userId,
          convertedToId: activity.id,
        },
      });
    }

    await logAdminAction(user.userId, "CREATE_ACTIVITY", "activity", activity.id);
    return NextResponse.json(
      {
        message: "Activity created successfully.",
        activity: {
          ...activity,
          date: serializeActivityDate(activity.date),
          durationMinutes: activity.durationMinutes,
          participantLimit: activity.participantLimit,
          participantCount: 0,
          attendanceCount: 0,
          participants: [],
          attendance: [],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) return validationResponse;
    return NextResponse.json({ error: toZodErrorMessage(error) }, { status: 400 });
  }
}
