"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const normalizedCurrentEmail = currentEmail.trim().toLowerCase();
  const normalizedNewEmail = email.trim().toLowerCase();
  const sameAsCurrent = normalizedNewEmail.length > 0 && normalizedNewEmail === normalizedCurrentEmail;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sameAsCurrent) {
      showToast("New email must be different from current email.", "error");
      return;
    }
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to change email.", "error");
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
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      showToast(data.error ?? "Unable to change email.", "error");
      return;
    }

    showToast(data.message ?? "Verification link sent.", "success");
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
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Email verified and updated successfully.</p>
          ) : null}
          {status === "invalid-token" || status === "missing-token" ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Invalid or expired verification link.</p>
          ) : null}
          {status === "email-in-use" ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">This email is already in use.</p>
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
            {sameAsCurrent ? <p className="text-xs text-destructive">New email must be different from your current email.</p> : null}
          </div>
          <Button type="submit" disabled={sameAsCurrent}>
            Send Verification Link
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
