"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityStatus } from "@prisma/client";
import { AppImage } from "@/components/ui/AppImage";
import { ActivityParticipationPanel } from "@/components/activities/ActivityParticipationPanel";
import { getActivityEnd, isActivityActiveNow } from "@/lib/activity-time";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  timeLabel: string;
  durationMinutes: number;
  participantLimit: number;
  location: string;
  organizer: string;
  imageUrl: string;
  status: ActivityStatus;
  participants: Array<{ userId: string }>;
  attendanceSigned: boolean;
};

type Props = {
  activities: ActivityItem[];
  authUserId: string;
};

export function UserActivitiesTabs({ activities, authUserId }: Props) {
  const searchParams = useSearchParams();
  const [sectionTab, setSectionTab] = useState<"ACTIVITY" | "MY_ACTIVITY">("ACTIVITY");
  const [myActivityFilter, setMyActivityFilter] = useState<"ACTIVE" | "COMPLETED" | "CANCELLED">("ACTIVE");
  const normalizedItems = useMemo(() => {
    return activities.map((activity) => {
      const joined = activity.participants.some((participant) => participant.userId === authUserId);
      const completed = getActivityEnd(new Date(activity.date), activity.timeLabel, activity.durationMinutes).getTime() < Date.now();
      const normalizedStatus =
        activity.status === ActivityStatus.CANCELLED ? "CANCELLED" : completed ? "COMPLETED" : "ACTIVE";
      return { ...activity, joined, completed, normalizedStatus };
    });
  }, [activities, authUserId]);
  const activityItems = useMemo(
    () =>
      normalizedItems.filter((activity) => {
        if (activity.joined) return false;
        if (activity.normalizedStatus === "CANCELLED" || activity.normalizedStatus === "COMPLETED") return false;
        return activity.normalizedStatus === "ACTIVE";
      }),
    [normalizedItems],
  );
  const myActivityItems = useMemo(
    () =>
      normalizedItems.filter(
        (activity) => activity.joined && activity.normalizedStatus === myActivityFilter,
      ),
    [myActivityFilter, normalizedItems],
  );

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus) return;
    const target = normalizedItems.find((activity) => activity.id === focus);
    if (target?.joined) {
      setSectionTab("MY_ACTIVITY");
      setMyActivityFilter(target.normalizedStatus === "COMPLETED" ? "COMPLETED" : target.normalizedStatus === "CANCELLED" ? "CANCELLED" : "ACTIVE");
    } else {
      setSectionTab("ACTIVITY");
    }
    requestAnimationFrame(() => {
      const element = document.getElementById(`activity-${focus}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [searchParams, normalizedItems]);

  function renderCard(activity: ActivityItem & { joined: boolean; normalizedStatus: "ACTIVE" | "COMPLETED" | "CANCELLED" }) {
    const joined = activity.joined;
    const canAttendNow = isActivityActiveNow(new Date(activity.date), activity.timeLabel, activity.durationMinutes, new Date());
    const endTime = getActivityEnd(new Date(activity.date), activity.timeLabel, activity.durationMinutes);
    const isFull = activity.participants.length >= activity.participantLimit;
    const completed = activity.normalizedStatus === "COMPLETED";

    return (
      <article id={`activity-${activity.id}`} key={activity.id} className="overflow-hidden rounded-3xl border-2 border-[#6b4f3a] bg-white shadow-lg">
        <AppImage src={activity.imageUrl} alt={activity.title} className="h-52 w-full object-cover" />
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-textPrimary">{activity.title}</h2>
            {activity.normalizedStatus === "COMPLETED" ? (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Completed</span>
            ) : activity.normalizedStatus === "CANCELLED" ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-statusRejected">Cancelled</span>
            ) : isFull ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Full</span>
            ) : joined ? (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Joined</span>
            ) : (
              <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-green-700">Active</span>
            )}
          </div>
          <p className="text-sm leading-6 text-textSecondary">{activity.description}</p>
          <p className="text-sm text-textSecondary">
            {new Date(activity.date).toLocaleDateString()} at {activity.timeLabel} • {activity.location}
          </p>
          <p className="text-sm text-textSecondary">Duration: {activity.durationMinutes} minutes</p>
          <p className="text-sm text-textSecondary">
            Attendance window ends at {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-sm text-textSecondary">Organizer: {activity.organizer}</p>
          <p className="text-sm text-textSecondary">
            Participants: {activity.participants.length}/{activity.participantLimit} ({isFull ? "Full" : "Open"})
          </p>
          {!completed ? (
            <ActivityParticipationPanel
              activityId={activity.id}
              cancelled={activity.status === ActivityStatus.CANCELLED}
              full={isFull && !joined}
              joined={joined}
              attendanceSigned={activity.attendanceSigned}
              canAttendNow={canAttendNow}
            />
          ) : (
            <p className="rounded-2xl bg-mainBg px-3 py-2 text-sm text-textSecondary">
              {activity.attendanceSigned ? "Attendance signed for this activity." : "Attendance not signed."}
            </p>
          )}
        </div>
      </article>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary">Community Activities</h1>
        <p className="mt-2 text-sm text-textSecondary">Browse all activities and manage your joined activities with full filters.</p>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSectionTab("ACTIVITY")}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${sectionTab === "ACTIVITY" ? "border-black bg-black text-white" : "border-black/30 bg-white text-textPrimary"}`}
          >
            Activity
          </button>
          <button
            type="button"
            onClick={() => setSectionTab("MY_ACTIVITY")}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${sectionTab === "MY_ACTIVITY" ? "border-black bg-black text-white" : "border-black/30 bg-white text-textPrimary"}`}
          >
            My Activity
          </button>
        </div>
        {sectionTab === "ACTIVITY" ? (
        <div className="space-y-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {activityItems.length > 0 ? activityItems.map(renderCard) : <p className="rounded-2xl border-2 border-[#6b4f3a] bg-white p-4 text-sm text-textSecondary shadow-sm">No activities available at the moment. Stay tuned for upcoming events.</p>}
          </div>
        </div>
        ) : null}
        {sectionTab === "MY_ACTIVITY" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMyActivityFilter("ACTIVE")} className={`rounded-full border px-4 py-2 text-sm font-medium ${myActivityFilter === "ACTIVE" ? "border-black bg-black text-white" : "border-black/30 bg-white text-textPrimary"}`}>Active</button>
            <button type="button" onClick={() => setMyActivityFilter("COMPLETED")} className={`rounded-full border px-4 py-2 text-sm font-medium ${myActivityFilter === "COMPLETED" ? "border-black bg-black text-white" : "border-black/30 bg-white text-textPrimary"}`}>Completed</button>
            <button type="button" onClick={() => setMyActivityFilter("CANCELLED")} className={`rounded-full border px-4 py-2 text-sm font-medium ${myActivityFilter === "CANCELLED" ? "border-black bg-black text-white" : "border-black/30 bg-white text-textPrimary"}`}>Cancelled</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {myActivityItems.length > 0 ? myActivityItems.map(renderCard) : <p className="rounded-2xl border-2 border-[#6b4f3a] bg-white p-4 text-sm text-textSecondary shadow-sm">No activities available at the moment. Stay tuned for upcoming events.</p>}
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}
