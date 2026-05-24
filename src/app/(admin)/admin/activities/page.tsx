import { Suspense } from "react";
import { serializeActivityDate } from "@/lib/date-format";
import { prisma } from "@/lib/prisma";
import { getAdminActivitiesPage } from "@/lib/activities-list";
import { ActivityManager } from "@/components/activities/ActivityManager";
import { Card, CardContent } from "@/components/ui/card";

export default function ManageActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; focus?: string; fromSuggestion?: string }>;
}) {
  return (
    <Suspense fallback={<ManageActivitiesSkeleton />}>
      <ManageActivitiesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ManageActivitiesContent({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; focus?: string; fromSuggestion?: string }>;
}) {
  const params = await searchParams;
  const [sourceSuggestion, activities] = await Promise.all([
    params.fromSuggestion
      ? prisma.suggestion.findUnique({
          where: { id: params.fromSuggestion },
          include: { convertedTo: { select: { id: true } } },
        })
      : Promise.resolve(null),
    getAdminActivitiesPage(),
  ]);

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

function ManageActivitiesSkeleton() {
  return (
    <section className="page-stack">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Manage Activities</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create, edit, and monitor community activities.</p>
      </div>
      <div className="page-stack">
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        <div className="filter-stack">
          <div className="flex flex-wrap gap-2">
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="content-grid">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} className="overflow-hidden shadow-sm">
                <div className="aspect-video animate-pulse bg-muted" />
                <CardContent className="space-y-3 p-6">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
