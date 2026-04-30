"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { fetchCsrfToken } from "@/lib/client-security";

export function SignupForm() {
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

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to create account.");
      return;
    }

    setSuccess(data.message ?? "Account created successfully.");
    router.push("/login");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <AuthInput id="name" label="Full Name" name="name" placeholder="Your full name" required />
      <AuthInput
        id="email"
        label="University Email"
        name="email"
        type="email"
        placeholder="you@siswa.um.edu.my"
        autoComplete="email"
        required
      />
      <AuthInput
        id="password"
        label="Password"
        name="password"
        type="password"
        placeholder="Create a strong password"
        autoComplete="new-password"
        required
      />

      <p className="text-xs text-textSecondary">Must be 8+ chars with uppercase, lowercase, number, and symbol (!@#$%^&*).</p>

      {error ? <p className="rounded-lg bg-rose-50 p-2 text-sm text-statusRejected">{error}</p> : null}
      {success ? <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p> : null}

      <SubmitButton label="Create account" pendingLabel="Creating account..." />

      <p className="text-center text-sm text-textSecondary">
        Already have an account? <Link href="/login" className="text-primary hover:opacity-90">Login</Link>
      </p>
    </form>
  );
}
