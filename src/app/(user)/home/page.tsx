import Link from "next/link";
import { SuggestionStatus } from "@prisma/client";
import { getCurrentAuthUser } from "@/lib/auth";
import { getLatestUpcomingActivities } from "@/lib/activities-query";
import { prisma } from "@/lib/prisma";
import { AppImage } from "@/components/ui/AppImage";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { formatStatusLabel } from "@/lib/form-errors";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export default async function UserHomePage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const [upcoming, suggestions] = await Promise.all([
    getLatestUpcomingActivities(4),
    prisma.suggestion.findMany({
      where: { submittedById: authUser.userId },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: { convertedTo: { select: { status: true } } },
    }),
  ]);

  const statusBadgeClass: Record<SuggestionStatus | "CANCELLED", string> = {
    PENDING: "border-transparent bg-amber-500/15 text-amber-800",
    APPROVED: "border-transparent bg-emerald-500/15 text-emerald-800",
    REJECTED: "border-transparent bg-destructive/15 text-destructive",
    CANCELLED: "border-transparent bg-destructive/10 text-destructive",
  };

  return (
    <section className="page-stack">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rule enforced: home shows upcoming activities plus a neat suggestion-status summary table.
        </p>
      </div>
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
                  suggestions.map((suggestion) => {
                    const displayStatus =
                      suggestion.convertedTo?.status === "CANCELLED" ? "CANCELLED" : suggestion.status;
                    return (
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
                              statusBadgeClass[displayStatus],
                            )}
                          >
                            {formatStatusLabel(displayStatus)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
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
      <div className="filter-stack">
        <h2 className="text-lg font-semibold tracking-tight">Latest Activities</h2>
        <div className="content-grid">
          {upcoming.map((activity) => (
            <Link key={activity.id} href={`/activities?focus=${activity.id}`} className="group block">
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <AppImage src={activity.imageUrl} alt={activity.title} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                </div>
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug">{activity.title}</CardTitle>
                    <Badge variant={activity.status === "CANCELLED" ? "destructive" : "success"} className="shrink-0">
                      {activity.status === "CANCELLED" ? "Cancelled" : "Active"}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateDDMMYYYY(activity.date)} · {activity.location} · {activity.participants.length} participants
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
    </section>
  );
}
