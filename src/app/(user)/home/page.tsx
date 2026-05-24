import { Suspense } from "react";
import Link from "next/link";
import { SuggestionStatus } from "@prisma/client";
import { getCurrentAuthUser } from "@/lib/auth";
import { getLatestUpcomingActivitySummaries } from "@/lib/activities-query";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { formatStatusLabel } from "@/lib/form-errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export default async function UserHomePage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  return (
    <section className="page-stack">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rule enforced: home shows upcoming activities plus a neat suggestion-status summary table.
        </p>
      </div>
      <Suspense fallback={<SectionSkeleton />}>
        <LatestSuggestions userId={authUser.userId} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <LatestActivities />
      </Suspense>
    </section>
  );
}

async function LatestSuggestions({ userId }: { userId: string }) {
  const suggestions = await prisma.suggestion.findMany({
    where: { submittedById: userId },
    orderBy: { submittedAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      date: true,
      location: true,
      status: true,
    },
  });

  const statusBadgeClass: Record<SuggestionStatus, string> = {
    PENDING: "border-transparent bg-amber-500/15 text-amber-800",
    APPROVED: "border-transparent bg-emerald-500/15 text-emerald-800",
    REJECTED: "border-transparent bg-destructive/15 text-destructive",
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b bg-muted/40 py-4">
        <CardTitle className="text-lg">Latest Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">Title</th>
                <th className="px-4 py-3 font-medium sm:px-6">Suggested Date</th>
                <th className="px-4 py-3 font-medium sm:px-6">Location</th>
                <th className="px-4 py-3 font-medium sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium sm:px-6">
                      <Link
                        href={`/suggestions?focus=${suggestion.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {suggestion.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground sm:px-6">{formatDateDDMMYYYY(suggestion.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground sm:px-6">{suggestion.location}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
                          statusBadgeClass[suggestion.status],
                        )}
                      >
                        {formatStatusLabel(suggestion.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground sm:px-6" colSpan={4}>
                    No suggestions submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

async function LatestActivities() {
  const upcoming = await getLatestUpcomingActivitySummaries(3);

  return (
    <div className="filter-stack">
      <h2 className="text-lg font-semibold tracking-tight">Latest Activities</h2>
      <div className="content-grid">
        {upcoming.map((activity) => (
          <Link key={activity.id} href={`/activities?focus=${activity.id}`} className="block">
            <Card className="h-full shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base leading-snug">{activity.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDateDDMMYYYY(activity.date)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.location} · {activity.timeLabel}
                </p>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {upcoming.length === 0 ? (
          <EmptyState message="No activities available at the moment. Stay tuned for upcoming events." className="col-span-full" />
        ) : null}
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="space-y-2 border-b bg-muted/40 py-4">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3 p-6">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
