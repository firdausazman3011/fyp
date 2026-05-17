"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SuggestionItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: string;
  displayStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  adminRemark: string | null;
  submittedAt: string;
  convertedAt: string | null;
  convertedToId: string | null;
  canModify: boolean;
};

const statusClass: Record<SuggestionItem["displayStatus"], string> = {
  PENDING: "border-transparent bg-amber-500/15 text-amber-800",
  APPROVED: "border-transparent bg-emerald-500/15 text-emerald-800",
  REJECTED: "border-transparent bg-destructive/15 text-destructive",
  CANCELLED: "border-transparent bg-destructive/10 text-destructive",
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
          <Button
            key={status}
            type="button"
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status[0] + status.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredSuggestions.map((suggestion) => (
          <Card id={`suggestion-${suggestion.id}`} key={suggestion.id} className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
              <CardTitle className="text-lg leading-snug">{suggestion.title}</CardTitle>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
                  statusClass[suggestion.displayStatus],
                )}
              >
                {suggestion.displayStatus}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="text-foreground/90">{suggestion.description}</p>
              <div className="grid gap-1">
                <p>Suggested Location: {suggestion.location}</p>
                <p>Suggested Date: {formatDateDDMMYYYY(suggestion.date)}</p>
              </div>
              {suggestion.adminRemark ? <p className="text-xs">Admin remark: {suggestion.adminRemark}</p> : null}
              {suggestion.status === "APPROVED" && suggestion.convertedAt && !suggestion.convertedToId ? (
                <p className="text-xs text-amber-700">
                  ⚠️ This activity was approved and created but later removed due to a lack of participant registration.
                </p>
              ) : null}
              {suggestion.canModify ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" onClick={() => setEditing(suggestion)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setDeleteId(suggestion.id)}>
                    Delete
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredSuggestions.length === 0 ? (
        <Card className="border-dashed bg-muted/20 shadow-none">
          <CardContent className="py-6 text-sm text-muted-foreground">No suggestions available at the moment.</CardContent>
        </Card>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-lg">
            <CardHeader>
              <CardTitle>Edit Suggestion</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form action={updateSuggestion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input id="edit-title" name="title" defaultValue={editing.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" defaultValue={editing.description} rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Suggested Date</Label>
                  <Input id="edit-date" name="date" type="date" defaultValue={editing.date.slice(0, 10)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Suggested Location</Label>
                  <Input id="edit-location" name="location" defaultValue={editing.location} required />
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                    Close
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
