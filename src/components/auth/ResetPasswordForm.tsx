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
    return <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">Missing reset token.</p>;
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

      <p className="text-xs text-textSecondary">Must be 8+ chars with uppercase, lowercase, number, and symbol (!@#$%^&*).</p>

      {error ? <p className="rounded-lg bg-rose-50 p-2 text-sm text-statusRejected">{error}</p> : null}
      {success ? <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p> : null}

      <SubmitButton label="Reset password" pendingLabel="Resetting..." />

      <p className="text-center text-sm text-textSecondary">
        Return to <Link href="/login" className="text-primary hover:opacity-90">Login</Link>
      </p>
    </form>
  );
}
