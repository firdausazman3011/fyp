import { NextResponse } from "next/server";
import { ActivityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createActivitySchema, parseFutureDateTime, toZodErrorMessage } from "@/lib/validation";
import { requireAuth, requireRole } from "@/lib/authorization";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";
import { logAdminAction } from "@/lib/audit";
import { rangesOverlap } from "@/lib/activity-time";

export async function GET() {
  const { user, response } = await requireAuth();
  if (response || !user) return response;

  const where =
    user.role === "USER"
      ? { status: ActivityStatus.PUBLISHED, date: { gte: new Date() } }
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
    const date = parseFutureDateTime(parsed.date, parsed.time);
    if (!date) {
      return NextResponse.json({ error: "Invalid date/time." }, { status: 400 });
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const sameDayActivities = await prisma.activity.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: { not: ActivityStatus.CANCELLED },
      },
      select: { date: true, durationMinutes: true },
    });
    const hasOverlap = sameDayActivities.some((existing) =>
      rangesOverlap(date, parsed.durationMinutes, existing.date, existing.durationMinutes),
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
        date,
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
          date: activity.date.toISOString(),
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
    const message = toZodErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
