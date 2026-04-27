"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

      <p className="text-xs text-slate-500">Must be 8+ chars with uppercase, number, and symbol (!@#$%^&*).</p>

      {error ? <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p> : null}

      <SubmitButton label="Reset password" pendingLabel="Resetting..." />

      <p className="text-center text-sm text-slate-600">
        Return to <Link href="/login" className="text-blue-600 hover:text-blue-500">Login</Link>
      </p>
    </form>
  );
}
