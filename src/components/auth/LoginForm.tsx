"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Invalid email or password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <AuthInput
        id="email"
        label="Email"
        name="email"
        type="email"
        placeholder="you@siswa.um.edu.my or admin email"
        autoComplete="email"
        required
      />
      <AuthInput
        id="password"
        label="Password"
        name="password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        required
      />

      {error ? <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}

      <SubmitButton label="Login" pendingLabel="Logging in..." />

      <div className="flex items-center justify-between text-sm">
        <Link href="/signup" className="text-slate-600 hover:text-slate-900">Create account</Link>
        <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500">Forgot password?</Link>
      </div>
    </form>
  );
}
