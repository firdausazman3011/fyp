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
  const [redirecting, setRedirecting] = useState(false);

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

    setSuccess("Password reset link sent. Please check your email.");
    setRedirecting(true);
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 1500);
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

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
      ) : null}

      <SubmitButton label={redirecting ? "Redirecting..." : "Send reset link"} pendingLabel="Sending..." />

      <p className="text-center text-sm text-muted-foreground">
        Back to{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
