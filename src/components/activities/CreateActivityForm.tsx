"use client";

import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";

export function CreateActivityForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      setError("Unable to create activity.");
      return;
    }

    const response = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        date: formData.get("date"),
        time: formData.get("time"),
        location: formData.get("location"),
        organizer: formData.get("organizer"),
        imageUrl: formData.get("imageUrl"),
        status: formData.get("status"),
      }),
    });

    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Unable to create activity.");
      return;
    }
    setMessage(data.message ?? "Activity created successfully.");
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-xl border border-borderUi bg-cardBg p-4">
      <input name="title" placeholder="Title" className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
      <textarea name="description" placeholder="Description" rows={4} className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="date" type="date" className="rounded border border-borderUi px-3 py-2 text-sm" required />
        <input name="time" type="time" className="rounded border border-borderUi px-3 py-2 text-sm" required />
      </div>
      <input name="location" placeholder="Location" className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
      <input name="organizer" placeholder="Organizer" className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
      <input name="imageUrl" placeholder="Image URL" className="w-full rounded border border-borderUi px-3 py-2 text-sm" required />
      <select name="status" className="w-full rounded border border-borderUi px-3 py-2 text-sm">
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      {error ? <p className="text-sm text-statusRejected">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-white">Create Activity</button>
    </form>
  );
}
