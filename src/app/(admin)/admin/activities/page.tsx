import { serializeActivityDate } from "@/lib/date-format";
import { prisma } from "@/lib/prisma";
import { getAdminActivitiesPage } from "@/lib/activities-list";
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
  const activities = await getAdminActivitiesPage();

  return (
    <section className="page-stack">
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
                date: serializeActivityDate(sourceSuggestion.date),
                location: sourceSuggestion.location,
              }
            : null
        }
        activities={activities}
      />
    </section>
  );
}
