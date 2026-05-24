import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { serializeActivityDate } from "@/lib/date-format";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
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
      _count: { select: { participants: true } },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  const [joined, attendance] = await Promise.all([
    prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId: id, userId: user.userId } },
      select: { id: true },
    }),
    prisma.attendanceRecord.findUnique({
      where: { activityId_userId: { activityId: id, userId: user.userId } },
      select: { id: true },
    }),
  ]);

  return NextResponse.json({
    activity: {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      date: serializeActivityDate(activity.date),
      timeLabel: activity.timeLabel,
      durationMinutes: activity.durationMinutes,
      participantLimit: activity.participantLimit,
      location: activity.location,
      organizer: activity.organizer,
      imageUrl: activity.imageUrl,
      status: activity.status,
      participantCount: activity._count.participants,
      joined: Boolean(joined),
      attendanceSigned: Boolean(attendance),
    },
  });
}
