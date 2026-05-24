import { Suspense } from "react";
import { getCurrentAuthUser } from "@/lib/auth";
import { getUserActivitiesList } from "@/lib/activities-list";
import { UserActivitiesTabs } from "@/components/activities/UserActivitiesTabs";
import { Card, CardContent } from "@/components/ui/card";

export default async function ActivitiesPage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  return (
    <Suspense fallback={<ActivitiesPageSkeleton />}>
      <ActivitiesContent userId={authUser.userId} />
    </Suspense>
  );
}

async function ActivitiesContent({ userId }: { userId: string }) {
  const activities = await getUserActivitiesList(userId);

  return <UserActivitiesTabs activities={activities} />;
}

function ActivitiesPageSkeleton() {
  return (
    <section className="page-stack">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Community Activities</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse all activities and manage your joined activities with full filters.
        </p>
      </div>
      <div className="filter-stack">
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="content-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="overflow-hidden shadow-sm">
              <CardContent className="space-y-3 p-6">
                <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-8 w-28 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
