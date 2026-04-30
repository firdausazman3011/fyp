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
      select: { status: true, convertedToId: true },
    }),
    prisma.activity.findMany({
      select: { status: true, date: true, timeLabel: true, durationMinutes: true },
    }),
  ]);
  const latestActivities = rawLatestActivities
    .filter((item) => item.status !== "CANCELLED" && !isActivityCompleted(item.date, item.timeLabel, item.durationMinutes))
    .slice(0, 4);
  const suggestionSummary = {
    approved: suggestionCounts.filter((item) => item.status === SuggestionStatus.APPROVED && !item.convertedToId).length,
    pending: suggestionCounts.filter((item) => item.status === SuggestionStatus.PENDING && !item.convertedToId).length,
    rejected: suggestionCounts.filter((item) => item.status === SuggestionStatus.REJECTED && !item.convertedToId).length,
    converted: suggestionCounts.filter((item) => Boolean(item.convertedToId)).length,
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
          <h2 className="text-xl font-semibold text-textPrimary">Activities Overview</h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-lime-100 px-3 py-1 text-green-700">Active: {activitySummary.active}</span>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Completed: {activitySummary.completed}</span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-statusRejected">Cancelled: {activitySummary.cancelled}</span>
          </div>
        </div>
        <div className="rounded-3xl border-2 border-[#6b4f3a] bg-white p-5 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-textPrimary">Suggestions Overview</h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-statusApproved px-3 py-1 text-textPrimary">Approved: {suggestionSummary.approved}</span>
            <span className="rounded-full bg-statusPending px-3 py-1 text-textPrimary">Pending: {suggestionSummary.pending}</span>
            <span className="rounded-full bg-statusRejected px-3 py-1 text-white">Rejected: {suggestionSummary.rejected}</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Converted: {suggestionSummary.converted}</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border-2 border-[#6b4f3a] bg-white shadow-sm">
          <div className="border-b border-primary/10 bg-rose-50 px-5 py-4">
            <p className="text-lg font-semibold text-textPrimary">Latest Suggestion Status</p>
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
                        item.convertedTo
                          ? "bg-blue-100 text-blue-700"
                          : item.status === "APPROVED"
                            ? "bg-statusApproved text-textPrimary"
                            : item.status === "PENDING"
                              ? "bg-statusPending text-textPrimary"
                              : "bg-statusRejected text-white"
                      }`}>
                        {item.convertedTo ? "CONVERTED" : item.status}
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
        <h2 className="text-lg font-semibold text-textPrimary">Recently Added Activities (Card)</h2>
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
