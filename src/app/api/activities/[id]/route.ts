import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { logAdminAction } from "@/lib/audit";
import { sanitizeText, validateCsrfOrThrow } from "@/lib/security";
import { parseFutureDateTime, toZodErrorMessage, updateActivitySchema } from "@/lib/validation";
import { DEFAULT_ACTIVITY_ORGANIZER } from "@/lib/constants";
import { ActivityStatus } from "@prisma/client";
import { rangesOverlap } from "@/lib/activity-time";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("ADMIN");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateActivitySchema.parse(body);
    const date = parseFutureDateTime(parsed.date, parsed.time);

    if (!date) {
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

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const sameDayActivities = await prisma.activity.findMany({
      where: {
        id: { not: id },
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

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        title: sanitizeText(parsed.title),
        description: sanitizeText(parsed.description),
        date,
        timeLabel: parsed.time,
        durationMinutes: parsed.durationMinutes,
        participantLimit: parsed.participantLimit,
        location: sanitizeText(parsed.location),
        organizer: sanitizeText(parsed.organizer || DEFAULT_ACTIVITY_ORGANIZER),
        imageUrl: parsed.imageUrl.trim(),
        status: parsed.status,
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        attendance: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    await logAdminAction(user.userId, "UPDATE_ACTIVITY", "activity", id);
    return NextResponse.json({
      message: "Activity updated successfully.",
      activity: {
        ...activity,
        date: activity.date.toISOString(),
        durationMinutes: activity.durationMinutes,
        participantLimit: activity.participantLimit,
        participantCount: activity.participants.length,
        attendanceCount: activity.attendance.length,
        participants: activity.participants.map((participant) => participant.user),
        attendance: activity.attendance.map((record) => ({
          ...record.user,
          confirmedAt: record.confirmedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
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

  return NextResponse.json({ message: "Activity deleted successfully." });
}
