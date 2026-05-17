"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { fetchCsrfToken } from "@/lib/client-security";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      setError("Unable to reset password.");
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        token,
        password: formData.get("password"),
      }),
    });

    const data = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to reset password.");
      return;
    }

    setSuccess(data.message ?? "Password reset successful.");
    router.push("/login");
    router.refresh();
  }

  if (!token) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Missing reset token.</p>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <AuthInput
        id="password"
        label="New Password"
        name="password"
        type="password"
        placeholder="Enter a strong new password"
        autoComplete="new-password"
        required
      />

      <p className="text-xs text-muted-foreground">Must be 8+ chars with uppercase, lowercase, number, and symbol (!@#$%^&*).</p>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
      ) : null}

      <SubmitButton label="Reset password" pendingLabel="Resetting..." />

      <p className="text-center text-sm text-muted-foreground">
        Return to{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
