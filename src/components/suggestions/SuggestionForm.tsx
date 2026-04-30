"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";

export function SuggestionForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);

  async function onSubmit(formData: FormData) {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to submit suggestion.", "error");
      return;
    }

    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        date: formData.get("date"),
        location: formData.get("location"),
      }),
    });

    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      showToast(data.error ?? "Unable to submit suggestion.", "error");
      return;
    }
    showToast(data.message ?? "Suggestion submitted successfully.", "success");
    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
          Add New Activity Suggestion
        </button>
      ) : null}
      {showForm ? (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4">
    <form action={onSubmit} className="w-full max-w-2xl space-y-4 rounded-3xl border-2 border-[#6b4f3a] bg-cardBg p-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-textPrimary">Title:</label>
        <input name="title" placeholder="Title (5-100 chars)" className="w-full rounded-xl border border-primary/20 bg-rose-50 px-3 py-2 text-sm" required />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-textPrimary">Description:</label>
        <textarea name="description" placeholder="Description (20-1000 chars)" className="w-full rounded-xl border border-primary/20 bg-rose-50 px-3 py-2 text-sm" rows={4} required />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-textPrimary">Suggested Date:</label>
        <input name="date" type="date" className="w-full rounded-xl border border-primary/20 bg-rose-50 px-3 py-2 text-sm" required />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-textPrimary">Location:</label>
        <input name="location" placeholder="Enter location" className="w-full rounded-xl border border-primary/20 bg-rose-50 px-3 py-2 text-sm" required />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-lg">Submit Suggestion</button>
        <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-black px-5 py-2.5 text-sm font-semibold text-black">Close</button>
      </div>
    </form>
    </div>
      ) : null}
    </div>
  );
}
