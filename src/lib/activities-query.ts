import { ActivityStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isActivityCompleted } from "@/lib/activity-time";
import { getTodayDateOnly } from "@/lib/date-only";

const latestUpcomingInclude = {
  participants: true,
} satisfies Prisma.ActivityInclude;

export type LatestUpcomingActivity = Prisma.ActivityGetPayload<{
  include: typeof latestUpcomingInclude;
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
    include: latestUpcomingInclude,
  });

  return candidates
    .filter(
      (activity) =>
        activity.status !== ActivityStatus.CANCELLED &&
        !isActivityCompleted(activity.date, activity.timeLabel, activity.durationMinutes),
    )
    .slice(0, limit);
}
