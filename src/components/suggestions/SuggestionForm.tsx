"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Button type="button" onClick={() => setShowForm(true)}>
          Add New Activity Suggestion
        </Button>
      ) : null}
      {showForm ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-lg">
            <CardHeader>
              <CardTitle>New suggestion</CardTitle>
            </CardHeader>
            <form action={onSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="suggestion-title">Title</Label>
                  <Input id="suggestion-title" name="title" placeholder="Title (5-100 chars)" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestion-description">Description</Label>
                  <Textarea id="suggestion-description" name="description" placeholder="Description (20-1000 chars)" rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestion-date">Suggested Date</Label>
                  <Input id="suggestion-date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestion-location">Suggested Location</Label>
                  <Input id="suggestion-location" name="location" placeholder="Enter location" required />
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap justify-end gap-2 border-t bg-muted/30">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Close
                </Button>
                <Button type="submit">Submit Suggestion</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
