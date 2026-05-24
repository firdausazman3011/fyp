import { NextResponse } from "next/server";
import { ActivityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { validateCsrfOrThrow } from "@/lib/security";
import { activityScheduleOverlaps } from "@/lib/activity-time";
import { revalidateActivityRoutes } from "@/lib/revalidate-routes";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  const { id } = await params;
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  if (activity.status === ActivityStatus.CANCELLED || activity.status === ActivityStatus.COMPLETED) {
    return NextResponse.json({ error: "You cannot join this activity." }, { status: 400 });
  }
  if (activity.status !== ActivityStatus.PUBLISHED) {
    return NextResponse.json({ error: "Activity is not open for joining." }, { status: 400 });
  }

  const joinedSameDay = await prisma.activityParticipant.findMany({
    where: {
      userId: user.userId,
      activityId: { not: id },
      activity: {
        date: activity.date,
        status: { not: ActivityStatus.CANCELLED },
      },
    },
    include: {
      activity: { select: { date: true, timeLabel: true, durationMinutes: true, title: true } },
    },
  });
  const hasOverlap = joinedSameDay.some((participant) =>
    activityScheduleOverlaps(
      activity.date,
      activity.timeLabel,
      activity.durationMinutes,
      participant.activity.date,
      participant.activity.timeLabel,
      participant.activity.durationMinutes,
    ),
  );
  if (hasOverlap) {
    return NextResponse.json(
      { error: "You already joined another activity that overlaps with this schedule." },
      { status: 400 },
    );
  }

  const currentParticipants = await prisma.activityParticipant.count({
    where: { activityId: id },
  });
  if (currentParticipants >= activity.participantLimit) {
    const alreadyJoined = await prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId: id, userId: user.userId } },
    });
    if (!alreadyJoined) {
      return NextResponse.json({ error: "Activity is full." }, { status: 400 });
    }
  }

  await prisma.activityParticipant.upsert({
    where: { activityId_userId: { activityId: id, userId: user.userId } },
    update: {},
    create: { activityId: id, userId: user.userId },
  });

  revalidateActivityRoutes();
  return NextResponse.json({ message: "Joined activity successfully." });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  const { id } = await params;
  const participant = await prisma.activityParticipant.findUnique({
    where: { activityId_userId: { activityId: id, userId: user.userId } },
  });

  if (!participant) {
    return NextResponse.json({ error: "You have not joined this activity." }, { status: 404 });
  }

  await prisma.activityParticipant.delete({
    where: { activityId_userId: { activityId: id, userId: user.userId } },
  });

  await prisma.attendanceRecord.deleteMany({
    where: { activityId: id, userId: user.userId },
  });

  revalidateActivityRoutes();
  return NextResponse.json({ message: "You have unjoined this activity." });
}
