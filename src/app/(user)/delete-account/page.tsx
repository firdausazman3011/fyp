"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Delete Account</CardTitle>
        <CardDescription>This action is permanent and will remove your profile and account access.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="destructive" onClick={() => setConfirmOpen(true)}>
          Delete Account
        </Button>
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
            <Label htmlFor="delete-password">Password</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </div>
        </ConfirmDialog>
      </CardContent>
    </Card>
  );
}
