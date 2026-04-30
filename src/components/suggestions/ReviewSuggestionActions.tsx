"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Props = {
  suggestionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  converted: boolean;
};

export function ReviewSuggestionActions({ suggestionId, status, converted }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isConverted, setIsConverted] = useState(converted);
  const [pending, setPending] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  async function review(status: "APPROVED" | "REJECTED") {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to review suggestion.", "error");
      return;
    }

    setPending(true);
    const response = await fetch(`/api/suggestions/${suggestionId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      showToast(data.error ?? "Unable to review suggestion.", "error");
      return;
    }
    setCurrentStatus(status);
    setConfirmRejectOpen(false);
    showToast(data.message ?? "Suggestion updated.", "success");
    router.refresh();
  }

  async function convert() {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to convert suggestion.", "error");
      return;
    }
    setPending(true);
    const response = await fetch(`/api/suggestions/${suggestionId}/convert`, {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
    });
    const data = (await response.json()) as { message?: string; error?: string; activity?: { id: string } };
    setPending(false);
    if (!response.ok) {
      showToast(data.error ?? "Unable to convert suggestion.", "error");
      return;
    }
    setIsConverted(true);
    showToast(data.message ?? "Suggestion converted.", "success");
    if (data.activity?.id) {
      router.push(`/admin/activities?edit=${data.activity.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => review("APPROVED")}
          disabled={pending || currentStatus !== "PENDING"}
          className="w-full rounded-full bg-secondary px-4 py-2 text-sm font-medium text-textPrimary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => setConfirmRejectOpen(true)}
          disabled={pending || currentStatus !== "PENDING"}
          className="w-full rounded-full bg-statusRejected px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={convert}
          disabled={pending || currentStatus !== "APPROVED" || isConverted}
          className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isConverted ? "Converted" : "Convert"}
        </button>
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
