"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { clearProfileCache } from "@/lib/profile-cache";
import { fetchCsrfToken } from "@/lib/client-security";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
};

export function LogoutButton({ className, variant = "default", size = "default" }: LogoutButtonProps) {
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

    clearProfileCache();
    setConfirmOpen(false);
    showToast("Logged out successfully.", "success");
    router.replace("/login");
  }

  return (
    <>
      <Button type="button" variant={variant} size={size} className={cn(className)} onClick={() => setConfirmOpen(true)}>
        Logout
      </Button>
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
