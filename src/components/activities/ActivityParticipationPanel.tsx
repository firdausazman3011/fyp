"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/button";

type ActivityParticipationPanelProps = {
  activityId: string;
  joined: boolean;
  attendanceSigned: boolean;
  canAttendNow: boolean;
  cancelled: boolean;
  full: boolean;
};

export function ActivityParticipationPanel({
  activityId,
  joined,
  attendanceSigned,
  canAttendNow,
  cancelled,
  full,
}: ActivityParticipationPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isJoined, setIsJoined] = useState(joined);
  const [hasAttendance, setHasAttendance] = useState(attendanceSigned);
  const [pending, setPending] = useState(false);
  const [confirmUnjoinOpen, setConfirmUnjoinOpen] = useState(false);

  async function request(method: "POST" | "DELETE", url: string, successMessage: string) {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to perform this action right now.", "error");
      return false;
    }

    setPending(true);
    const response = await fetch(url, {
      method,
      headers: { "x-csrf-token": csrfToken },
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setPending(false);

    if (!response.ok) {
      showToast(data.error ?? "Request failed.", "error");
      return false;
    }

    showToast(data.message ?? successMessage, "success");
    router.refresh();
    return true;
  }

  async function handleJoin() {
    if (cancelled) return;
    const ok = await request("POST", `/api/activities/${activityId}/join`, "Joined activity successfully.");
    if (ok) setIsJoined(true);
  }

  async function handleUnjoin() {
    const ok = await request("DELETE", `/api/activities/${activityId}/join`, "You have unjoined this activity.");
    if (ok) {
      setConfirmUnjoinOpen(false);
      setIsJoined(false);
      setHasAttendance(false);
    }
  }

  async function handleAttendance() {
    const ok = await request("POST", `/api/activities/${activityId}/attendance`, "Attendance signed successfully.");
    if (ok) setHasAttendance(true);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isJoined ? (
          <>
            {cancelled ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                This activity has been cancelled by the admin.
              </p>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || hasAttendance}
                  onClick={() => setConfirmUnjoinOpen(true)}
                >
                  {hasAttendance ? "Cannot Unjoin After Attendance" : pending ? "Please wait..." : "Unjoin Activity"}
                </Button>
                <Button type="button" disabled={pending || hasAttendance || !canAttendNow} onClick={handleAttendance}>
                  {hasAttendance ? "Attendance Signed" : canAttendNow ? "Sign Attendance" : "Attendance During Event"}
                </Button>
              </>
            )}
          </>
        ) : (
          <Button type="button" disabled={pending || cancelled || full} onClick={handleJoin}>
            {pending ? "Joining..." : full ? "Activity Full" : "Join Activity"}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmUnjoinOpen}
        title="Unjoin Activity"
        description="Do you want to remove yourself from this activity?"
        confirmLabel="Yes, Unjoin"
        tone="danger"
        onConfirm={handleUnjoin}
        onCancel={() => setConfirmUnjoinOpen(false)}
      />
    </>
  );
}
