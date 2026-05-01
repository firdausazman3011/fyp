import { SuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { isActivityCompleted } from "@/lib/activity-time";
import { AppImage } from "@/components/ui/AppImage";

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
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border-2 border-[#6b4f3a] bg-white p-5 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-textPrimary">Activity Overview</h2>
          <div className="mt-4 flex items-center justify-center">
            <div className="px-6">
              <p className="text-2xl font-semibold text-green-700">{activitySummary.active}</p>
              <p className="text-xs font-semibold text-green-700">Active</p>
            </div>
            <div className="h-10 w-px bg-borderUi" />
            <div className="px-6">
              <p className="text-2xl font-semibold text-slate-700">{activitySummary.completed}</p>
              <p className="text-xs font-semibold text-slate-700">Completed</p>
            </div>
            <div className="h-10 w-px bg-borderUi" />
            <div className="px-6">
              <p className="text-2xl font-semibold text-statusRejected">{activitySummary.cancelled}</p>
              <p className="text-xs font-semibold text-statusRejected">Cancelled</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border-2 border-[#6b4f3a] bg-white p-5 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-textPrimary">Suggestion Overview</h2>
          <div className="mt-4 flex items-center justify-center">
            <div className="px-5">
              <p className="text-2xl font-semibold text-green-700">{suggestionSummary.approved}</p>
              <p className="text-xs font-semibold text-green-700">Approved</p>
            </div>
            <div className="h-10 w-px bg-borderUi" />
            <div className="px-5">
              <p className="text-2xl font-semibold text-amber-600">{suggestionSummary.pending}</p>
              <p className="text-xs font-semibold text-amber-600">Pending</p>
            </div>
            <div className="h-10 w-px bg-borderUi" />
            <div className="px-5">
              <p className="text-2xl font-semibold text-statusRejected">{suggestionSummary.rejected}</p>
              <p className="text-xs font-semibold text-statusRejected">Rejected</p>
            </div>
            <div className="h-10 w-px bg-borderUi" />
            <div className="px-5">
              <p className="text-2xl font-semibold text-blue-700">{suggestionSummary.converted}</p>
              <p className="text-xs font-semibold text-blue-700">Converted</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border-2 border-[#6b4f3a] bg-white shadow-sm">
          <div className="border-b border-primary/10 bg-rose-50 px-5 py-4">
            <p className="text-lg font-semibold text-textPrimary">Latest Suggestions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-mainBg text-textSecondary">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Suggested Date</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {latestSuggestions.map((item) => (
                  <tr key={item.id} className="border-t border-borderUi">
                    <td className="px-5 py-3 font-medium text-textPrimary">
                      <Link className="underline-offset-2 hover:underline" href={`/admin/suggestions?focus=${item.id}`}>{item.title}</Link>
                    </td>
                    <td className="px-5 py-3 text-textSecondary">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-textSecondary">{item.location}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.convertedAt
                          ? "bg-blue-100 text-blue-700"
                          : item.status === "APPROVED"
                            ? "bg-statusApproved text-textPrimary"
                            : item.status === "PENDING"
                              ? "bg-statusPending text-textPrimary"
                              : "bg-statusRejected text-white"
                      }`}>
                        {item.convertedAt ? (item.convertedTo ? "CONVERTED" : "CONVERTED (DELETED)") : item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-textPrimary">Latest Activities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {latestActivities.map((item) => (
            <Link key={item.id} href={`/admin/activities?focus=${item.id}`} className="block">
              <article className="overflow-hidden rounded-3xl border-2 border-[#6b4f3a] bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="h-44 w-full bg-mainBg">
                  <AppImage src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-textPrimary">{item.title}</h2>
                    <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-green-700">Active</span>
                  </div>
                  <p className="mt-1 text-sm text-textSecondary">{item.description}</p>
                  <p className="mt-3 text-xs text-textSecondary">
                    {new Date(item.date).toLocaleDateString()} • {item.location} • {item.participants.length} participants
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
        {latestActivities.length === 0 ? (
          <p className="rounded-2xl border-2 border-[#6b4f3a] bg-white p-4 text-sm text-textSecondary shadow-sm">
            No activities available at the moment. Stay tuned for upcoming events.
          </p>
        ) : null}
      </div>
    </section>
  );
}
