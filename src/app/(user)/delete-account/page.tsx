"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");

  async function handleDeleteAccount() {
    if (!password.trim()) {
      showToast("Please enter your password in the popup.", "error");
      return;
    }

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to delete account.", "error");
      return;
    }

    const response = await fetch("/api/users/me/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      showToast(data.error ?? "Unable to delete account.", "error");
      return;
    }

    setConfirmOpen(false);
    setPassword("");
    showToast(data.message ?? "Account deleted successfully.", "success");
    router.push("/login");
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-[#6b4f3a] bg-cardBg p-6 shadow-lg">
      <h1 className="text-2xl font-semibold">Delete Account</h1>
      <p className="mt-2 text-sm text-textSecondary">This action is permanent and will remove your profile and account access.</p>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
      >
        Delete Account
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel="Delete My Account"
        tone="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setConfirmOpen(false);
          setPassword("");
        }}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-textPrimary">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-borderUi px-4 py-3 text-sm"
          />
        </div>
      </ConfirmDialog>
    </section>
  );
}
