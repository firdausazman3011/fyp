"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";

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
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border-2 border-[#6b4f3a] bg-white p-6 shadow-lg">
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary">{title}</h1>
        <p className="mt-2 text-sm text-textSecondary">{description}</p>
        <p className="mt-1 text-sm text-textSecondary">Current email: {currentEmail}</p>
      </div>
      {status === "verified" ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Email verified and updated successfully.</p>
      ) : null}
      {status === "invalid-token" || status === "missing-token" ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-statusRejected">Invalid or expired verification link.</p>
      ) : null}
      {status === "email-in-use" ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-statusRejected">This email is already in use.</p>
      ) : null}
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
        <label className="text-sm font-medium text-textPrimary">New Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@gmail.com"
          className="w-full rounded-2xl border border-borderUi px-4 py-3 text-sm"
          required
        />
        {sameAsCurrent ? (
          <p className="text-xs text-statusRejected">New email must be different from your current email.</p>
        ) : null}
      </div>
      <button type="submit" disabled={sameAsCurrent} className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
        Send Verification Link
      </button>
    </form>
  );
}
