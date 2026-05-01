import Link from "next/link";
import { SuggestionStatus } from "@prisma/client";
import { getCurrentAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppImage } from "@/components/ui/AppImage";
import { formatDateDDMMYYYY } from "@/lib/date-format";

export default async function UserHomePage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const [upcoming, suggestions] = await Promise.all([
    prisma.activity.findMany({
      where: {
        status: "PUBLISHED",
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      take: 4,
      include: {
        participants: true,
      },
    }),
    prisma.suggestion.findMany({
      where: { submittedById: authUser.userId },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: { convertedTo: { select: { status: true } } },
    }),
  ]);

  const statusClass: Record<SuggestionStatus | "CANCELLED", string> = {
    PENDING: "bg-statusPending text-textPrimary",
    APPROVED: "bg-statusApproved text-textPrimary",
    REJECTED: "bg-statusRejected text-white",
    CANCELLED: "bg-rose-100 text-statusRejected",
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary">Home</h1>
        <p className="mt-2 text-sm text-textSecondary">
          Rule enforced: home shows upcoming activities plus a neat suggestion-status summary table.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border-2 border-[#6b4f3a] bg-white shadow-lg">
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
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  (() => {
                    const displayStatus =
                      suggestion.convertedTo?.status === "CANCELLED" ? "CANCELLED" : suggestion.status;
                    return (
                  <tr key={suggestion.id} className="border-t border-borderUi">
                    <td className="px-5 py-3 font-medium text-textPrimary">
                      <Link href={`/suggestions?focus=${suggestion.id}`} className="underline-offset-2 hover:underline">
                        {suggestion.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-textSecondary">{formatDateDDMMYYYY(suggestion.date)}</td>
                    <td className="px-5 py-3 text-textSecondary">{suggestion.location}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[displayStatus]}`}>
                        {displayStatus}
                      </span>
                    </td>
                  </tr>
                    );
                  })()
                ))
              ) : (
                <tr>
                  <td className="px-5 py-4 text-textSecondary" colSpan={4}>
                    No suggestions submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-textPrimary">Latest Activities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
        {upcoming.map((activity) => (
          <Link key={activity.id} href={`/activities?focus=${activity.id}`} className="block">
          <article className="overflow-hidden rounded-3xl border-2 border-[#6b4f3a] bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="h-44 w-full bg-mainBg">
              <AppImage src={activity.imageUrl} alt={activity.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-textPrimary">{activity.title}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    activity.status === "CANCELLED"
                      ? "bg-rose-100 text-statusRejected"
                      : "bg-lime-100 text-green-700"
                  }`}
                >
                  {activity.status === "CANCELLED" ? "Cancelled" : "Active"}
                </span>
              </div>
              <p className="mt-1 text-sm text-textSecondary">{activity.description}</p>
              <p className="mt-3 text-xs text-textSecondary">
                {formatDateDDMMYYYY(activity.date)} • {activity.location} • {activity.participants.length} participants
              </p>
            </div>
          </article>
          </Link>
        ))}
        </div>
      </div>
      {upcoming.length === 0 ? (
        <p className="rounded-2xl border-2 border-[#6b4f3a] bg-white p-4 text-sm text-textSecondary shadow-sm">
          No activities available at the moment. Stay tuned for upcoming events.
        </p>
      ) : null}
    </section>
  );
}
