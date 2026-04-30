"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";

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
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border-2 border-[#6b4f3a] bg-white p-6 shadow-lg">
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary">{title}</h1>
        <p className="mt-2 text-sm text-textSecondary">{description}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-textPrimary">Current Password:</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
          className="w-full rounded-2xl border border-borderUi px-4 py-3 text-sm"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-textPrimary">New Password:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          className="w-full rounded-2xl border border-borderUi px-4 py-3 text-sm"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-textPrimary">Confirm New Password:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          className="w-full rounded-2xl border border-borderUi px-4 py-3 text-sm"
          required
        />
      </div>

      <p className="text-xs text-textSecondary">
        Rule enforced: password change requires current password and a strong new password.
      </p>

      <button type="submit" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg">
        Update Password
      </button>
    </form>
  );
}
