"use client";

import { useRouter } from "next/navigation";
import { fetchCsrfToken } from "@/lib/client-security";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { useState } from "react";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleLogout() {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to logout right now.", "error");
      return;
    }

    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
    });
    if (!response.ok) {
      showToast("Logout failed.", "error");
      return;
    }

    setConfirmOpen(false);
    showToast("Logged out successfully.", "success");
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={className ?? "rounded-lg border border-black bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900"}
      >
        Logout
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Logout"
        description="Do you want to logout from UniConnect?"
        confirmLabel="Yes, Logout"
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
