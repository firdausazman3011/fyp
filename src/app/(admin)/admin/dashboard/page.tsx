import { SuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { isActivityCompleted } from "@/lib/activity-time";
import { AppImage } from "@/components/ui/AppImage";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [latestSuggestions, rawLatestActivities, suggestionCounts, allActivities] = await Promise.all([
    prisma.suggestion.findMany({
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: { submittedBy: { select: { name: true } }, convertedTo: { select: { id: true } } },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { participants: true },
    }),
    prisma.suggestion.findMany({
      select: { status: true, convertedToId: true, convertedAt: true },
    }),
    prisma.activity.findMany({
      select: { status: true, date: true, timeLabel: true, durationMinutes: true },
    }),
  ]);
  const latestActivities = rawLatestActivities
    .filter((item) => item.status !== "CANCELLED" && !isActivityCompleted(item.date, item.timeLabel, item.durationMinutes))
    .slice(0, 4);
  const suggestionSummary = {
    approved: suggestionCounts.filter((item) => item.status === SuggestionStatus.APPROVED && !item.convertedAt).length,
    pending: suggestionCounts.filter((item) => item.status === SuggestionStatus.PENDING && !item.convertedAt).length,
    rejected: suggestionCounts.filter((item) => item.status === SuggestionStatus.REJECTED && !item.convertedAt).length,
    converted: suggestionCounts.filter((item) => Boolean(item.convertedAt)).length,
  };
  const activitySummary = {
    active: allActivities.filter((item) => item.status !== "CANCELLED" && !isActivityCompleted(item.date, item.timeLabel, item.durationMinutes)).length,
    completed: allActivities.filter((item) => item.status !== "CANCELLED" && isActivityCompleted(item.date, item.timeLabel, item.durationMinutes)).length,
    cancelled: allActivities.filter((item) => item.status === "CANCELLED").length,
  };

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Overview of community activity and suggestions.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Activity Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-stretch gap-2.5 rounded-xl border bg-muted/30 p-3">
              <div className="flex flex-1 flex-col items-center gap-2 rounded-lg bg-background p-4 relative overflow-hidden border">
                <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-lg bg-emerald-500" />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                <p className="text-2xl font-semibold text-emerald-700">{activitySummary.active}</p>
                <p className="text-xs font-medium text-muted-foreground">Active</p>
              </div>
              <div className="flex flex-1 flex-col items-center gap-2 rounded-lg bg-background p-4 relative overflow-hidden border">
                <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-lg bg-zinc-400" />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M20 6 9 17l-5-5"/><path d="m6 9 6 6 8-8"/></svg>
                <p className="text-2xl font-semibold text-foreground">{activitySummary.completed}</p>
                <p className="text-xs font-medium text-muted-foreground">Completed</p>
              </div>
              <div className="flex flex-1 flex-col items-center gap-2 rounded-lg bg-background p-4 relative overflow-hidden border">
                <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-lg bg-destructive" />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                <p className="text-2xl font-semibold text-destructive">{activitySummary.cancelled}</p>
                <p className="text-xs font-medium text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestion Overview */}
        <Card>
          <CardHeader className="pb-2 ">
            <CardTitle className="flex items-center gap-2 text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>
              Suggestion Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  label: "Approved",
                  value: suggestionSummary.approved,
                  colorClass: "text-emerald-700",
                  accentClass: "bg-emerald-500",
                  iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
                  iconColor: "text-emerald-600",
                  borderClass: "border-l-emerald-500",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>,
                },
                {
                  label: "Pending",
                  value: suggestionSummary.pending,
                  colorClass: "text-amber-600",
                  accentClass: "bg-amber-500",
                  iconBg: "bg-amber-50 dark:bg-amber-950/40",
                  iconColor: "text-amber-600",
                  borderClass: "border-l-amber-500",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                },
                {
                  label: "Rejected",
                  value: suggestionSummary.rejected,
                  colorClass: "text-destructive",
                  accentClass: "bg-destructive",
                  iconBg: "bg-red-50 dark:bg-red-950/40",
                  iconColor: "text-destructive",
                  borderClass: "border-l-destructive",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>,
                },
                {
                  label: "Converted",
                  value: suggestionSummary.converted,
                  colorClass: "text-blue-600",
                  accentClass: "bg-blue-500",
                  iconBg: "bg-blue-50 dark:bg-blue-950/40",
                  iconColor: "text-blue-600",
                  borderClass: "border-l-blue-500",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-background p-3.5 relative overflow-hidden border-l-2",
                    item.borderClass
                  )}
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", item.iconBg, item.iconColor)}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <p className={cn("text-xl font-semibold leading-tight", item.colorClass)}>{item.value}</p>
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                {latestSuggestions.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium sm:px-6">
                      <Link
                        className="text-primary underline-offset-4 hover:underline"
                        href={`/admin/suggestions?focus=${item.id}`}
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground sm:px-6">{formatDateDDMMYYYY(item.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground sm:px-6">{item.location}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
                          item.convertedAt
                            ? "border-transparent bg-blue-500/15 text-blue-800"
                            : item.status === "APPROVED"
                              ? "border-transparent bg-emerald-500/15 text-emerald-800"
                              : item.status === "PENDING"
                                ? "border-transparent bg-amber-500/15 text-amber-800"
                                : "border-transparent bg-destructive/15 text-destructive",
                        )}
                      >
                        {item.convertedAt ? (item.convertedTo ? "CONVERTED" : "CONVERTED (DELETED)") : item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Latest Activities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {latestActivities.map((item) => (
            <Link key={item.id} href={`/admin/activities?focus=${item.id}`} className="group block">
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <AppImage src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                </div>
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                    <Badge variant="success" className="shrink-0">
                      Active
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateDDMMYYYY(item.date)} · {item.location} · {item.participants.length} participants
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
        {latestActivities.length === 0 ? (
          <Card className="border-dashed bg-muted/20 p-6 shadow-none">
            <p className="text-sm text-muted-foreground">No activities available at the moment. Stay tuned for upcoming events.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
