"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCsrfToken } from "@/lib/client-security";
import type { FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChangeEmailFormProps = {
  title: string;
  description: string;
  currentEmail: string;
  status?: string;
};

export function ChangeEmailForm({ title, description, currentEmail, status }: ChangeEmailFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSuccessMessage(null);
    setSubmitting(true);

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      setFieldErrors({ email: "Unable to change email." });
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/users/me/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ email, currentPassword }),
    });
    const data = (await response.json()) as { message?: string; error?: string; fieldErrors?: FieldErrors };
    setSubmitting(false);

    if (!response.ok) {
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setFieldErrors(data.fieldErrors);
        return;
      }
      setFieldErrors({ email: data.error ?? "Unable to change email." });
      return;
    }

    setEmail("");
    setCurrentPassword("");
    setSuccessMessage(
      data.message ?? "Verification link sent to the new email. Please verify to complete the update.",
    );
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <p className="text-sm text-muted-foreground">Current email: {currentEmail}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {status === "verified" ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Email verified and updated successfully.
            </p>
          ) : null}
          {status === "invalid-token" || status === "missing-token" ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Invalid or expired verification link.
            </p>
          ) : null}
          {status === "email-in-use" ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              This email is already in use.
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email-current-password">Current Password</Label>
            <Input
              id="email-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
            <FieldError message={fieldErrors.currentPassword} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email</Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
            />
            <FieldError message={fieldErrors.email} />
          </div>

          {successMessage ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{successMessage}</p>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Verification Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
