"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import type { FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChangePasswordFormProps = {
  title: string;
  description: string;
};

export function ChangePasswordForm({ title, description }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      setFieldErrors({ currentPassword: "Unable to change password." });
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/users/me/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const data = (await response.json()) as { message?: string; error?: string; fieldErrors?: FieldErrors };
    setSubmitting(false);

    if (!response.ok) {
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setFieldErrors(data.fieldErrors);
        return;
      }
      setFieldErrors({ currentPassword: data.error ?? "Unable to change password." });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccessMessage(data.message ?? "Password changed successfully.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
            <FieldError message={fieldErrors.currentPassword} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
            <FieldError message={fieldErrors.newPassword} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
            <FieldError message={fieldErrors.confirmPassword} />
          </div>

          <p className="text-xs text-muted-foreground">
            Rule enforced: password change requires current password and a strong new password.
          </p>

          {successMessage ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{successMessage}</p>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
