import { serializeActivityDate } from "@/lib/date-format";
import { prisma } from "@/lib/prisma";
import { getCurrentAuthUser } from "@/lib/auth";
import { UserActivitiesTabs } from "@/components/activities/UserActivitiesTabs";

export default async function ActivitiesPage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const allActivities = await prisma.activity.findMany({
    where: {},
    orderBy: [{ date: "asc" }, { timeLabel: "asc" }],
    include: {
      participants: true,
      attendance: {
        where: { userId: authUser.userId },
      },
    },
  });

  return (
    <UserActivitiesTabs
      authUserId={authUser.userId}
      activities={allActivities.map((activity) => ({
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
        participants: activity.participants.map((participant) => ({ userId: participant.userId })),
        attendanceSigned: activity.attendance.length > 0,
      }))}
    />
  );
}
