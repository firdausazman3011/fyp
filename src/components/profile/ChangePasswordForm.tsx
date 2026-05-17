"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChangePasswordFormProps = {
  title: string;
  description: string;
};

export function ChangePasswordForm({ title, description }: ChangePasswordFormProps) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to change password.", "error");
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
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      showToast(data.error ?? "Unable to change password.", "error");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast(data.message ?? "Password changed successfully.", "success");
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
          </div>

          <p className="text-xs text-muted-foreground">
            Rule enforced: password change requires current password and a strong new password.
          </p>

          <Button type="submit">Update Password</Button>
        </form>
      </CardContent>
    </Card>
  );
}
