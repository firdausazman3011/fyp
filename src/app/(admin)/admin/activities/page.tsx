import { prisma } from "@/lib/prisma";
import { ActivityManager } from "@/components/activities/ActivityManager";

export default async function ManageActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; focus?: string; fromSuggestion?: string }>;
}) {
  const params = await searchParams;
  const sourceSuggestion = params.fromSuggestion
    ? await prisma.suggestion.findUnique({
        where: { id: params.fromSuggestion },
        include: { convertedTo: { select: { id: true } } },
      })
    : null;
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
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Manage Activities</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create, edit, and monitor community activities.</p>
      </div>
      <ActivityManager
        initialEditId={params.edit ?? null}
        initialFocusId={params.focus ?? null}
        sourceSuggestion={
          sourceSuggestion && sourceSuggestion.status === "APPROVED" && !sourceSuggestion.convertedTo && !sourceSuggestion.convertedAt
            ? {
                id: sourceSuggestion.id,
                title: sourceSuggestion.title,
                description: sourceSuggestion.description,
                date: sourceSuggestion.date.toISOString(),
                location: sourceSuggestion.location,
              }
            : null
        }
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
