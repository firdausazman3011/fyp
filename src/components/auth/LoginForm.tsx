"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { fetchCsrfToken } from "@/lib/client-security";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      setError("Unable to login.");
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = (await response.json()) as { error?: string; role?: "USER" | "ADMIN" };

    if (!response.ok) {
      setError(data.error ?? "Invalid email or password.");
      return;
    }

    router.push(data.role === "ADMIN" ? "/admin/dashboard" : "/home");
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

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <SubmitButton label="Login" pendingLabel="Logging in..." />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link href="/signup" className="underline-offset-4 transition-colors hover:text-foreground">
          Create account
        </Link>
        <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
