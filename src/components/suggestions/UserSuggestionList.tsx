"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type SuggestionItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: string;
  displayStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  adminRemark: string | null;
  canModify: boolean;
};

const statusClass: Record<SuggestionItem["displayStatus"], string> = {
  PENDING: "bg-statusPending text-textPrimary",
  APPROVED: "bg-statusApproved text-textPrimary",
  REJECTED: "bg-statusRejected text-white",
  CANCELLED: "bg-rose-100 text-statusRejected",
};

export function UserSuggestionList({ initialSuggestions }: { initialSuggestions: SuggestionItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<"APPROVED" | "PENDING" | "REJECTED" | "CANCELLED">("PENDING");
  const [editing, setEditing] = useState<SuggestionItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filteredSuggestions = useMemo(
    () => initialSuggestions.filter((item) => item.displayStatus === filter),
    [filter, initialSuggestions],
  );

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus) return;
    const target = initialSuggestions.find((suggestion) => suggestion.id === focus);
    if (target) {
      setFilter(target.displayStatus);
      requestAnimationFrame(() => {
        const element = document.getElementById(`suggestion-${focus}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [initialSuggestions, searchParams]);

  async function updateSuggestion(formData: FormData) {
    if (!editing) return;
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) return showToast("Unable to update suggestion.", "error");

    const response = await fetch(`/api/suggestions/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        date: formData.get("date"),
        location: formData.get("location"),
      }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) return showToast(data.error ?? "Unable to update suggestion.", "error");
    showToast(data.message ?? "Suggestion updated.", "success");
    setEditing(null);
    router.refresh();
  }

  async function deleteSuggestion() {
    if (!deleteId) return;
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) return showToast("Unable to delete suggestion.", "error");

    const response = await fetch(`/api/suggestions/${deleteId}`, {
      method: "DELETE",
      headers: { "x-csrf-token": csrfToken },
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) return showToast(data.error ?? "Unable to delete suggestion.", "error");
    showToast(data.message ?? "Suggestion deleted.", "success");
    setDeleteId(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(["APPROVED", "PENDING", "REJECTED", "CANCELLED"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${filter === status ? "border-black bg-black text-white" : "border-black/30 bg-white text-textPrimary"}`}
          >
            {status[0] + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredSuggestions.map((suggestion) => (
          <article id={`suggestion-${suggestion.id}`} key={suggestion.id} className="rounded-3xl border-2 border-[#6b4f3a] bg-cardBg p-5 shadow-sm">
            <p className="font-semibold">{suggestion.title}</p>
            <p className="text-sm text-textSecondary">{suggestion.description}</p>
            <div className="mt-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[suggestion.displayStatus]}`}>
                {suggestion.displayStatus}
              </span>
            </div>
            {suggestion.adminRemark ? <p className="mt-1 text-xs text-textSecondary">Admin remark: {suggestion.adminRemark}</p> : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={!suggestion.canModify}
                onClick={() => setEditing(suggestion)}
                className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={!suggestion.canModify}
                onClick={() => setDeleteId(suggestion.id)}
                className="rounded-full border border-black px-4 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      {filteredSuggestions.length === 0 ? (
        <p className="rounded-2xl border-2 border-[#6b4f3a] bg-white p-4 text-sm text-textSecondary shadow-sm">
          No suggestions available at the moment.
        </p>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4">
          <form action={updateSuggestion} className="w-full max-w-2xl space-y-3 rounded-2xl border-2 border-[#6b4f3a] bg-white p-5">
            <h3 className="text-lg font-semibold">Edit Suggestion</h3>
            <label className="text-sm font-medium text-textPrimary">Title:</label>
            <input name="title" defaultValue={editing.title} className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
            <label className="text-sm font-medium text-textPrimary">Description:</label>
            <textarea name="description" defaultValue={editing.description} rows={4} className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
            <label className="text-sm font-medium text-textPrimary">Suggested Date:</label>
            <input name="date" type="date" defaultValue={editing.date.slice(0, 10)} className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
            <label className="text-sm font-medium text-textPrimary">Location:</label>
            <input name="location" defaultValue={editing.location} className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
            <div className="flex gap-2">
              <button type="submit" className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-black px-4 py-2 text-sm font-semibold text-black">Close</button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Suggestion"
        description="Do you want to delete this suggestion?"
        confirmLabel="Delete"
        tone="danger"
        onConfirm={deleteSuggestion}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
