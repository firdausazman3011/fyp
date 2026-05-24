import { ActivityStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isActivityCompleted } from "@/lib/activity-time";
import { getTodayDateOnly } from "@/lib/date-only";

const latestUpcomingSelect = {
  id: true,
  title: true,
  description: true,
  date: true,
  timeLabel: true,
  durationMinutes: true,
  location: true,
  imageUrl: true,
  status: true,
  _count: { select: { participants: true } },
} satisfies Prisma.ActivitySelect;

export type LatestUpcomingActivity = Prisma.ActivityGetPayload<{
  select: typeof latestUpcomingSelect;
}> & {
  participants: { length: number };
};

const latestUpcomingSummarySelect = {
  id: true,
  title: true,
  date: true,
  location: true,
  timeLabel: true,
} satisfies Prisma.ActivitySelect;

export type LatestUpcomingActivitySummary = Prisma.ActivityGetPayload<{
  select: typeof latestUpcomingSummarySelect;
}>;

/** Up to 4 published, non-cancelled, non-completed activities from today onward (by calendar date). */
export async function getLatestUpcomingActivities(limit = 4): Promise<LatestUpcomingActivity[]> {
  const candidates = await prisma.activity.findMany({
    where: {
      status: ActivityStatus.PUBLISHED,
      date: { gte: getTodayDateOnly() },
    },
    orderBy: [{ date: "asc" }, { timeLabel: "asc" }],
    take: limit * 5,
    select: latestUpcomingSelect,
  });

  return candidates
    .filter(
      (activity) =>
        activity.status !== ActivityStatus.CANCELLED &&
        !isActivityCompleted(activity.date, activity.timeLabel, activity.durationMinutes),
    )
    .slice(0, limit)
    .map((activity) => ({
      ...activity,
      participants: { length: activity._count.participants },
    }));
}

export async function getLatestUpcomingActivitySummaries(
  limit = 3,
): Promise<LatestUpcomingActivitySummary[]> {
  const today = getTodayDateOnly();
  const now = new Date();
  const currentTimeLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return prisma.activity.findMany({
    where: {
      status: ActivityStatus.PUBLISHED,
      OR: [
        { date: { gt: today } },
        {
          date: today,
          timeLabel: { gte: currentTimeLabel },
        },
      ],
    },
    orderBy: [{ date: "asc" }, { timeLabel: "asc" }],
    take: limit,
    select: latestUpcomingSummarySelect,
  });
}
