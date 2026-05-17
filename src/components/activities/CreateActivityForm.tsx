"use client";

import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <Card>
      <CardContent className="pt-6">
        <form action={onSubmit} className="space-y-4">
          <Input name="title" placeholder="Title" required />
          <textarea
            name="description"
            placeholder="Description"
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="date" type="date" required />
            <Input name="time" type="time" required />
          </div>
          <Input name="location" placeholder="Location" required />
          <Input name="organizer" placeholder="Organizer" required />
          <Input name="imageUrl" placeholder="Image URL" required />
          <select
            name="status"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button type="submit">Create Activity</Button>
        </form>
      </CardContent>
    </Card>
  );
}
