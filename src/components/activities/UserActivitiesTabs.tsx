"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityStatus } from "@prisma/client";
import { ActivityDetailModal } from "@/components/activities/ActivityDetailModal";
import { getActivityEnd } from "@/lib/activity-time";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import type { UserActivityListItem } from "@/lib/activities-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type Props = {
  activities: UserActivityListItem[];
};

export function UserActivitiesTabs({ activities: initialActivities }: Props) {
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState(initialActivities);
  const [sectionTab, setSectionTab] = useState<"ACTIVITY" | "MY_ACTIVITY">("ACTIVITY");
  const [myActivityFilter, setMyActivityFilter] = useState<"ACTIVE" | "COMPLETED" | "CANCELLED">("ACTIVE");
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  const normalizedItems = useMemo(() => {
    return activities.map((activity) => {
      const completed =
        getActivityEnd(new Date(activity.date), activity.timeLabel, activity.durationMinutes).getTime() < Date.now();
      const normalizedStatus =
        activity.status === ActivityStatus.CANCELLED ? "CANCELLED" : completed ? "COMPLETED" : "ACTIVE";
      return { ...activity, completed, normalizedStatus };
    });
  }, [activities]);

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

  const selectedListItem = detailId ? (activities.find((item) => item.id === detailId) ?? null) : null;

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
    setDetailId(focus);
    requestAnimationFrame(() => {
      const element = document.getElementById(`activity-${focus}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [searchParams, normalizedItems]);

  function handleParticipationChange(
    activityId: string,
    patch: Partial<Pick<UserActivityListItem, "joined" | "attendanceSigned" | "participantCount">>,
  ) {
    setActivities((current) =>
      current.map((item) => (item.id === activityId ? { ...item, ...patch } : item)),
    );
  }

  function renderCard(activity: (typeof normalizedItems)[number]) {
    const isFull = activity.participantCount >= activity.participantLimit;

    function statusBadge() {
      if (activity.normalizedStatus === "COMPLETED") {
        return <Badge variant="muted" className="shrink-0">Completed</Badge>;
      }
      if (activity.normalizedStatus === "CANCELLED") {
        return <Badge variant="destructive" className="shrink-0">Cancelled</Badge>;
      }
      if (isFull && !activity.joined) {
        return <Badge variant="warning" className="shrink-0">Full</Badge>;
      }
      if (activity.joined) {
        return (
          <Badge variant="outline" className="shrink-0 border-blue-200 bg-blue-500/10 text-blue-800">
            Joined
          </Badge>
        );
      }
      return <Badge variant="success" className="shrink-0">Active</Badge>;
    }

    return (
      <Card id={`activity-${activity.id}`} key={activity.id} className="overflow-hidden shadow-sm">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg leading-snug">{activity.title}</CardTitle>
            {statusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{formatDateDDMMYYYY(activity.date)} · {activity.location}</p>
          <p>
            Participants: {activity.participantCount}/{activity.participantLimit}
            {activity.joined ? " · You joined" : null}
            {activity.attendanceSigned ? " · Attendance signed" : null}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => setDetailId(activity.id)}>
            View details
          </Button>
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

      <ActivityDetailModal
        activityId={detailId}
        listItem={selectedListItem}
        onClose={() => setDetailId(null)}
        onParticipationChange={handleParticipationChange}
      />
    </section>
  );
}
