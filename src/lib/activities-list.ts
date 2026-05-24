import { ActivityStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeActivityDate } from "@/lib/date-format";

export const USER_ACTIVITIES_LIMIT = 50;
export const ADMIN_ACTIVITIES_PAGE_SIZE = 20;

/** Minimal fields for activity list cards (no relation joins). */
const userActivityListSelect = {
  id: true,
  title: true,
  date: true,
  status: true,
  location: true,
  timeLabel: true,
  durationMinutes: true,
  participantLimit: true,
  _count: { select: { participants: true } },
} satisfies Prisma.ActivitySelect;

export type UserActivityListItem = {
  id: string;
  title: string;
  date: string;
  status: ActivityStatus;
  location: string;
  timeLabel: string;
  durationMinutes: number;
  participantLimit: number;
  participantCount: number;
  joined: boolean;
  attendanceSigned: boolean;
};

function mapListRow(
  activity: Prisma.ActivityGetPayload<{ select: typeof userActivityListSelect }>,
  joinedSet: Set<string>,
  attendanceSet: Set<string>,
): UserActivityListItem {
  return {
    id: activity.id,
    title: activity.title,
    date: serializeActivityDate(activity.date),
    status: activity.status,
    location: activity.location,
    timeLabel: activity.timeLabel,
    durationMinutes: activity.durationMinutes,
    participantLimit: activity.participantLimit,
    participantCount: activity._count.participants,
    joined: joinedSet.has(activity.id),
    attendanceSigned: attendanceSet.has(activity.id),
  };
}

/**
 * List load: one activity query (no nested participants/attendance) plus two
 * indexed lookups for the current user's joins and attendance.
 */
export async function getUserActivitiesList(userId: string): Promise<UserActivityListItem[]> {
  const [joinedLinks, attendanceLinks, published] = await Promise.all([
    prisma.activityParticipant.findMany({
      where: { userId },
      select: { activityId: true },
    }),
    prisma.attendanceRecord.findMany({
      where: { userId },
      select: { activityId: true },
    }),
    prisma.activity.findMany({
      where: { status: ActivityStatus.PUBLISHED },
      orderBy: [{ date: "asc" }, { timeLabel: "asc" }],
      take: USER_ACTIVITIES_LIMIT,
      select: userActivityListSelect,
    }),
  ]);

  const joinedSet = new Set(joinedLinks.map((row) => row.activityId));
  const attendanceSet = new Set(attendanceLinks.map((row) => row.activityId));
  const publishedIds = new Set(published.map((row) => row.id));
  const missingJoinedIds = [...joinedSet].filter((id) => !publishedIds.has(id));

  const joinedExtras =
    missingJoinedIds.length > 0
      ? await prisma.activity.findMany({
          where: { id: { in: missingJoinedIds } },
          select: userActivityListSelect,
        })
      : [];

  const byId = new Map<string, UserActivityListItem>();
  for (const activity of [...published, ...joinedExtras]) {
    if (!byId.has(activity.id)) {
      byId.set(activity.id, mapListRow(activity, joinedSet, attendanceSet));
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.timeLabel.localeCompare(b.timeLabel),
  );
}

export async function getAdminActivitiesPage() {
  const rows = await prisma.activity.findMany({
    orderBy: { date: "asc" },
    take: ADMIN_ACTIVITIES_PAGE_SIZE,
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
    attendanceCount: activity._count.attendance,
  }));
}
