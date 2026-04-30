"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { fetchCsrfToken } from "@/lib/client-security";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      setError("Unable to process request.");
      return;
    }

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        email: formData.get("email"),
      }),
    });

    const data = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to process request.");
      return;
    }

    setSuccess(data.message ?? "If the account exists, a reset link has been sent.");
    router.push("/login");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <AuthInput
        id="email"
        label="Registered Email"
        name="email"
        type="email"
        placeholder="you@siswa.um.edu.my"
        autoComplete="email"
        required
      />

      {error ? <p className="rounded-lg bg-rose-50 p-2 text-sm text-statusRejected">{error}</p> : null}
      {success ? <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p> : null}

      <SubmitButton label="Send reset link" pendingLabel="Sending..." />

      <p className="text-center text-sm text-textSecondary">
        Back to <Link href="/login" className="text-primary hover:opacity-90">Login</Link>
      </p>
    </form>
  );
}
