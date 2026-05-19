"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityStatus } from "@prisma/client";
import { AppImage } from "@/components/ui/AppImage";
import { ActivityParticipationPanel } from "@/components/activities/ActivityParticipationPanel";
import { getActivityEnd, isActivityActiveNow } from "@/lib/activity-time";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

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
    () => normalizedItems.filter((activity) => activity.joined && activity.normalizedStatus === myActivityFilter),
    [myActivityFilter, normalizedItems],
  );

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus) return;
    const target = normalizedItems.find((activity) => activity.id === focus);
    if (target?.joined) {
      setSectionTab("MY_ACTIVITY");
      setMyActivityFilter(
        target.normalizedStatus === "COMPLETED" ? "COMPLETED" : target.normalizedStatus === "CANCELLED" ? "CANCELLED" : "ACTIVE",
      );
    } else {
      setSectionTab("ACTIVITY");
    }
    requestAnimationFrame(() => {
      const element = document.getElementById(`activity-${focus}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [searchParams, normalizedItems]);

  function renderCard(activity: (typeof normalizedItems)[number]) {
    const joined = activity.joined;
    const canAttendNow = isActivityActiveNow(new Date(activity.date), activity.timeLabel, activity.durationMinutes, new Date());
    const endTime = getActivityEnd(new Date(activity.date), activity.timeLabel, activity.durationMinutes);
    const isFull = activity.participants.length >= activity.participantLimit;
    const completed = activity.normalizedStatus === "COMPLETED";

    function statusBadge() {
      if (activity.normalizedStatus === "COMPLETED") {
        return (
          <Badge variant="muted" className="shrink-0">
            Completed
          </Badge>
        );
      }
      if (activity.normalizedStatus === "CANCELLED") {
        return (
          <Badge variant="destructive" className="shrink-0">
            Cancelled
          </Badge>
        );
      }
      if (isFull) {
        return (
          <Badge variant="warning" className="shrink-0">
            Full
          </Badge>
        );
      }
      if (joined) {
        return (
          <Badge variant="outline" className="shrink-0 border-blue-200 bg-blue-500/10 text-blue-800">
            Joined
          </Badge>
        );
      }
      return (
        <Badge variant="success" className="shrink-0">
          Active
        </Badge>
      );
    }

    return (
      <Card id={`activity-${activity.id}`} key={activity.id} className="overflow-hidden shadow-sm">
        <AppImage src={activity.imageUrl} alt={activity.title} className="aspect-video w-full object-cover" />
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl leading-snug">{activity.title}</CardTitle>
            {statusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="leading-relaxed text-foreground/90">{activity.description}</p>
          <p>
            {formatDateDDMMYYYY(activity.date)} at {activity.timeLabel} · {activity.location}
          </p>
          <p>Duration: {activity.durationMinutes} minutes</p>
          <p>Attendance window ends at {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <p>Organizer: {activity.organizer}</p>
          <p>
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
            <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {activity.attendanceSigned ? "Attendance signed for this activity." : "Attendance not signed."}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const emptyState = (
    <EmptyState message="No activities available at the moment. Stay tuned for upcoming events." className="col-span-full" />
  );

  return (
    <section className="page-stack">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Community Activities</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse all activities and manage your joined activities with full filters.</p>
      </div>
      <div className="filter-stack">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={sectionTab === "ACTIVITY" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSectionTab("ACTIVITY");
              setMyActivityFilter("ACTIVE");
            }}
          >
            Activity
          </Button>
          <Button
            type="button"
            variant={sectionTab === "MY_ACTIVITY" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSectionTab("MY_ACTIVITY");
              setMyActivityFilter("ACTIVE");
            }}
          >
            My Activity
          </Button>
        </div>
        {sectionTab === "ACTIVITY" ? (
          <div className="content-grid">
            {activityItems.length > 0 ? activityItems.map(renderCard) : emptyState}
          </div>
        ) : null}
        {sectionTab === "MY_ACTIVITY" ? (
          <div className="filter-stack">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={myActivityFilter === "ACTIVE" ? "default" : "outline"} size="sm" onClick={() => setMyActivityFilter("ACTIVE")}>
                Active
              </Button>
              <Button type="button" variant={myActivityFilter === "COMPLETED" ? "default" : "outline"} size="sm" onClick={() => setMyActivityFilter("COMPLETED")}>
                Completed
              </Button>
              <Button type="button" variant={myActivityFilter === "CANCELLED" ? "default" : "outline"} size="sm" onClick={() => setMyActivityFilter("CANCELLED")}>
                Cancelled
              </Button>
            </div>
            <div className="content-grid">
              {myActivityItems.length > 0 ? myActivityItems.map(renderCard) : emptyState}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
