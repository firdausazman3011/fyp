"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityStatus } from "@prisma/client";
import { ActivityParticipationPanel } from "@/components/activities/ActivityParticipationPanel";
import { getActivityEnd, isActivityActiveNow } from "@/lib/activity-time";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { AppImage } from "@/components/ui/AppImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserActivityListItem } from "@/lib/activities-list";

export type ActivityDetail = UserActivityListItem & {
  description: string;
  organizer: string;
  imageUrl: string;
};

type ActivityDetailModalProps = {
  activityId: string | null;
  listItem: UserActivityListItem | null;
  onClose: () => void;
  onParticipationChange: (activityId: string, patch: Partial<Pick<UserActivityListItem, "joined" | "attendanceSigned" | "participantCount">>) => void;
};

export function ActivityDetailModal({ activityId, listItem, onClose, onParticipationChange }: ActivityDetailModalProps) {
  const [detail, setDetail] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/activities/${activityId}/user-detail`, { credentials: "include" });
      const data = (await response.json()) as { activity?: ActivityDetail; error?: string };
      if (!response.ok || !data.activity) {
        throw new Error(data.error ?? "Unable to load activity details.");
      }
      setDetail(data.activity);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load activity details.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (!activityId) {
      setDetail(null);
      setError(null);
      return;
    }
    void loadDetail();
  }, [activityId, loadDetail]);

  if (!activityId || !listItem) return null;

  const display = detail ?? {
    ...listItem,
    description: "",
    organizer: "",
    imageUrl: "",
  };
  const completed =
    getActivityEnd(new Date(display.date), display.timeLabel, display.durationMinutes).getTime() < Date.now();
  const canAttendNow = isActivityActiveNow(
    new Date(display.date),
    display.timeLabel,
    display.durationMinutes,
    new Date(),
  );
  const isFull = display.participantCount >= display.participantLimit;
  const endTime = getActivityEnd(new Date(display.date), display.timeLabel, display.durationMinutes);

  function handleParticipationUpdate(patch: Partial<Pick<UserActivityListItem, "joined" | "attendanceSigned" | "participantCount">>) {
    if (!activityId) return;
    onParticipationChange(activityId, patch);
    setDetail((current) => (current ? { ...current, ...patch } : current));
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-lg">
        <CardHeader className="relative space-y-0 pb-4 pr-12">
          <CardTitle className="text-xl leading-snug">{display.title}</CardTitle>
          <Button type="button" variant="outline" size="sm" className="absolute right-4 top-4" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {loading && !detail ? <p className="text-sm text-primary">Loading details...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {detail ? (
            <>
              <AppImage src={detail.imageUrl} alt={detail.title} className="aspect-video w-full rounded-md object-cover" />
              <p className="leading-relaxed text-foreground/90">{detail.description}</p>
              <p>
                {formatDateDDMMYYYY(detail.date)} at {detail.timeLabel} · {detail.location}
              </p>
              <p>Duration: {detail.durationMinutes} minutes</p>
              <p>Attendance window ends at {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              <p>Organizer: {detail.organizer}</p>
              <p>
                Participants: {detail.participantCount}/{detail.participantLimit} ({isFull && !detail.joined ? "Full" : "Open"})
              </p>
              {!completed ? (
                <ActivityParticipationPanel
                  activityId={detail.id}
                  cancelled={detail.status === ActivityStatus.CANCELLED}
                  full={isFull && !detail.joined}
                  joined={detail.joined}
                  attendanceSigned={detail.attendanceSigned}
                  canAttendNow={canAttendNow}
                  onJoinedChange={(joined) => {
                    handleParticipationUpdate({
                      joined,
                      participantCount: joined
                        ? detail.participantCount + 1
                        : Math.max(0, detail.participantCount - 1),
                    });
                  }}
                  onAttendanceSigned={() => {
                    handleParticipationUpdate({ attendanceSigned: true });
                  }}
                />
              ) : (
                <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {detail.attendanceSigned ? "Attendance signed for this activity." : "Attendance not signed."}
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
