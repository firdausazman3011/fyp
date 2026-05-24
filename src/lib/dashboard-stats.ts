import { ActivityStatus, SuggestionStatus } from "@prisma/client";
import { isActivityCompleted } from "@/lib/activity-time";
import { prisma } from "@/lib/prisma";

export async function getSuggestionStatusSummary() {
  const [approved, pending, rejected, converted] = await Promise.all([
    prisma.suggestion.count({
      where: { status: SuggestionStatus.APPROVED, convertedAt: null },
    }),
    prisma.suggestion.count({
      where: { status: SuggestionStatus.PENDING, convertedAt: null },
    }),
    prisma.suggestion.count({
      where: { status: SuggestionStatus.REJECTED, convertedAt: null },
    }),
    prisma.suggestion.count({
      where: { convertedAt: { not: null } },
    }),
  ]);

  return { approved, pending, rejected, converted };
}

/** Counts by status; active/completed use schedule fields only (no full row load). */
export async function getActivityStatusSummary() {
  const cancelled = await prisma.activity.count({
    where: { status: ActivityStatus.CANCELLED },
  });

  const scheduled = await prisma.activity.findMany({
    where: { status: { not: ActivityStatus.CANCELLED } },
    select: { date: true, timeLabel: true, durationMinutes: true },
  });

  let completed = 0;
  let active = 0;
  for (const activity of scheduled) {
    if (isActivityCompleted(activity.date, activity.timeLabel, activity.durationMinutes)) {
      completed += 1;
    } else {
      active += 1;
    }
  }

  return { active, completed, cancelled };
}
