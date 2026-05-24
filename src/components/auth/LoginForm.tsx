"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
type LoginFormProps = {
  csrfToken: string;
};

export function LoginForm({ csrfToken }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as { error?: string; role?: "USER" | "ADMIN" };
    setSubmitting(false);

    if (!response.ok) {
      setPassword("");
      setError("Invalid email or password.");
      return;
    }

    router.replace(data.role === "ADMIN" ? "/admin/dashboard" : "/home");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthInput
        id="email"
        label="Email"
        name="email"
        type="email"
        placeholder="you@siswa.um.edu.my or admin email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        required
      />
      <AuthInput
        id="password"
        label="Password"
        name="password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={error}
        required
      />
      <SubmitButton label="Login" pendingLabel="Logging in..." isPending={submitting} />

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
