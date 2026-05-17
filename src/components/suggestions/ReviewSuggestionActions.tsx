"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";

type Props = {
  suggestionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  converted: boolean;
};

export function ReviewSuggestionActions({ suggestionId, status, converted }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [pending, setPending] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  async function review(next: "APPROVED" | "REJECTED") {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to review suggestion.", "error");
      return;
    }

    setPending(true);
    const response = await fetch(`/api/suggestions/${suggestionId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ status: next }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      showToast(data.error ?? "Unable to review suggestion.", "error");
      return;
    }
    setCurrentStatus(next);
    setConfirmRejectOpen(false);
    showToast(data.message ?? "Suggestion updated.", "success");
    router.refresh();
  }

  async function convert() {
    router.push(`/admin/activities?fromSuggestion=${suggestionId}`);
  }

  return (
    <>
      <div className="mt-1 flex flex-wrap gap-2">
        {currentStatus === "PENDING" ? (
          <>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled={pending} onClick={() => review("APPROVED")}>
              Approve
            </Button>
            <Button type="button" variant="destructive" className="w-full sm:w-auto" disabled={pending} onClick={() => setConfirmRejectOpen(true)}>
              Reject
            </Button>
          </>
        ) : null}
        {currentStatus === "APPROVED" && !converted ? (
          <Button type="button" className="w-full bg-blue-600 text-white hover:bg-blue-600/90 sm:w-auto" disabled={pending} onClick={convert}>
            Convert
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmRejectOpen}
        title="Reject Suggestion"
        description="Do you want to reject this suggestion?"
        confirmLabel="Reject Suggestion"
        tone="danger"
        onConfirm={() => review("REJECTED")}
        onCancel={() => setConfirmRejectOpen(false)}
      />
    </>
  );
}
