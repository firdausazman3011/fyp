"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
  }

  return (
    <form action={handleSubmit} className="space-y-4">
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

      <p className="text-xs text-slate-500">Must be 8+ chars with uppercase, number, and symbol (!@#$%^&*).</p>

      {error ? <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p> : null}

      <SubmitButton label="Create account" pendingLabel="Creating account..." />

      <p className="text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-500">Login</Link>
      </p>
    </form>
  );
}
