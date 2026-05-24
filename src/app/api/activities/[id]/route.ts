import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { logAdminAction } from "@/lib/audit";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";
import { parseActivityDateOnly, toZodErrorMessage, updateActivitySchema, validationErrorResponse } from "@/lib/validation";
import { ActivityStatus } from "@prisma/client";
import { activityScheduleOverlaps } from "@/lib/activity-time";
import { serializeActivityDate } from "@/lib/date-format";
import { revalidateActivityRoutes } from "@/lib/revalidate-routes";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("ADMIN");
  if (response || !user) return response;

  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      participants: {
        select: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      attendance: {
        select: {
          confirmedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  return NextResponse.json({
    activity: {
      id: activity.id,
      title: activity.title,
      participants: activity.participants.map((participant) => participant.user),
      attendance: activity.attendance.map((record) => ({
        ...record.user,
        confirmedAt: record.confirmedAt.toISOString(),
      })),
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("ADMIN");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateActivitySchema.parse(body);
    const activityDate = parseActivityDateOnly(parsed.date);
    if (!activityDate) {
      return NextResponse.json({ error: "Invalid date/time." }, { status: 400 });
    }

    const previousActivity = await prisma.activity.findUnique({
      where: { id },
      select: { status: true, participants: { select: { id: true } } },
    });
    if (!previousActivity) {
      return NextResponse.json({ error: "Activity not found." }, { status: 404 });
    }

    if (previousActivity.status === ActivityStatus.CANCELLED && parsed.status !== ActivityStatus.CANCELLED) {
      return NextResponse.json({ error: "Cancelled activities cannot be resumed." }, { status: 400 });
    }

    const sameDayActivities = await prisma.activity.findMany({
      where: {
        id: { not: id },
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

    const activity = await prisma.activity.update({
      where: { id },
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
      },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        timeLabel: true,
        durationMinutes: true,
        participantLimit: true,
        location: true,
        organizer: true,
        imageUrl: true,
        status: true,
        _count: {
          select: {
            participants: true,
            attendance: true,
          },
        },
      },
    });

    await logAdminAction(user.userId, "UPDATE_ACTIVITY", "activity", id);
    revalidateActivityRoutes();
    return NextResponse.json({
      message: "Activity updated successfully.",
      activity: {
        ...activity,
        date: serializeActivityDate(activity.date),
        durationMinutes: activity.durationMinutes,
        participantLimit: activity.participantLimit,
        participantCount: activity._count.participants,
        attendanceCount: activity._count.attendance,
      },
    });
  } catch (error) {
    const validationResponse = validationErrorResponse(error);
    if (validationResponse) return validationResponse;
    return NextResponse.json({ error: toZodErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("ADMIN");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  const { id } = await params;
  const participants = await prisma.activityParticipant.count({ where: { activityId: id } });
  if (participants > 0) {
    return NextResponse.json(
      { error: "Activities with participants cannot be deleted. Cancel the activity instead." },
      { status: 400 },
    );
  }
  await prisma.activity.delete({ where: { id } });
  await logAdminAction(user.userId, "DELETE_ACTIVITY", "activity", id);
  revalidateActivityRoutes();

  return NextResponse.json({ message: "Activity deleted successfully." });
}
