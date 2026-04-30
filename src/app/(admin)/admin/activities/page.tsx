import { prisma } from "@/lib/prisma";
import { ActivityManager } from "@/components/activities/ActivityManager";

export default async function ManageActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; focus?: string }>;
}) {
  const params = await searchParams;
  const activities = await prisma.activity.findMany({
    orderBy: { date: "asc" },
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

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary">Manage Activities</h1>
      </div>
      <ActivityManager
        initialEditId={params.edit ?? null}
        initialFocusId={params.focus ?? null}
        activities={activities.map((activity) => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          date: activity.date.toISOString(),
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
        }))}
      />
    </section>
  );
}
