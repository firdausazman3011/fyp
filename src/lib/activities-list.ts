import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeActivityDate } from "@/lib/date-format";

export const USER_ACTIVITIES_LIMIT = 50;
export const ADMIN_ACTIVITIES_PAGE_SIZE = 20;

const userActivitySelect = {
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
  participants: { select: { userId: true } },
  attendance: { select: { id: true } },
} satisfies Prisma.ActivitySelect;

export async function getUserActivitiesList(userId: string) {
  const rows = await prisma.activity.findMany({
    orderBy: [{ date: "asc" }, { timeLabel: "asc" }],
    take: USER_ACTIVITIES_LIMIT,
    select: {
      ...userActivitySelect,
      participants: { where: { userId }, select: { userId: true } },
      attendance: { where: { userId }, select: { id: true } },
    },
  });

  return rows.map((activity) => ({
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
    joined: activity.participants.length > 0,
    attendanceSigned: activity.attendance.length > 0,
  }));
}

export async function getAdminActivitiesPage() {
  const rows = await prisma.activity.findMany({
    orderBy: { date: "asc" },
    take: ADMIN_ACTIVITIES_PAGE_SIZE,
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      attendance: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return rows.map((activity) => ({
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
    participantCount: activity.participants.length,
    attendanceCount: activity.attendance.length,
    participants: activity.participants.map((participant) => participant.user),
    attendance: activity.attendance.map((record) => ({
      ...record.user,
      confirmedAt: record.confirmedAt.toISOString(),
    })),
  }));
}
