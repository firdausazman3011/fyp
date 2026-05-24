"use client";

import { useState, type FormEvent } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import type { FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  location: "",
};

export function SuggestionForm() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function closeForm() {
    setShowForm(false);
    setFieldErrors({});
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      setFieldErrors({ title: "Unable to submit suggestion." });
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify(form),
    });

    const data = (await response.json()) as { message?: string; error?: string; fieldErrors?: FieldErrors };
    setSubmitting(false);

    if (!response.ok) {
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setFieldErrors(data.fieldErrors);
        return;
      }
      setFieldErrors({ title: data.error ?? "Unable to submit suggestion." });
      return;
    }

    setForm(emptyForm);
    closeForm();
  }

  return (
    <div className="filter-stack">
      {!showForm ? (
        <Button type="button" onClick={() => setShowForm(true)}>
          Add New Activity Suggestion
        </Button>
      ) : null}
      {showForm ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-lg">
            <CardHeader className="relative space-y-0 pb-4 pr-12">
              <CardTitle>New suggestion</CardTitle>
              <Button type="button" variant="outline" size="sm" className="absolute right-4 top-4" onClick={closeForm}>
                Close
              </Button>
            </CardHeader>
            <form onSubmit={onSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="suggestion-title">Title</Label>
                  <Input
                    id="suggestion-title"
                    name="title"
                    placeholder="Title (5-100 chars)"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                  <FieldError message={fieldErrors.title} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestion-description">Description</Label>
                  <Textarea
                    id="suggestion-description"
                    name="description"
                    placeholder="Description (20-1000 chars)"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                  <FieldError message={fieldErrors.description} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestion-date">Suggested Date</Label>
                  <Input
                    id="suggestion-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                  <FieldError message={fieldErrors.date} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestion-location">Suggested Location</Label>
                  <Input
                    id="suggestion-location"
                    name="location"
                    placeholder="Enter location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                  <FieldError message={fieldErrors.location} />
                </div>
              </CardContent>
              <div className="flex justify-end border-t bg-muted/30 px-6 py-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
