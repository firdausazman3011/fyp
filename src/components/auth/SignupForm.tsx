"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthInput } from "@/components/auth/AuthInput";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { fetchCsrfToken } from "@/lib/client-security";
import type { FieldErrors } from "@/lib/form-errors";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSuccess(null);
    setSubmitting(true);

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      setFieldErrors({ email: "Unable to process request." });
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ name, email, password }),
    });

    const data = (await response.json()) as { message?: string; error?: string; fieldErrors?: FieldErrors };
    setSubmitting(false);

    if (!response.ok) {
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        setFieldErrors(data.fieldErrors);
        return;
      }
      setFieldErrors({ email: data.error ?? "Unable to create account." });
      return;
    }

    setSuccess(data.message ?? "Account created successfully.");
    window.setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthInput
        id="name"
        label="Full Name"
        name="name"
        placeholder="Your full name"
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        required
      />
      <AuthInput
        id="email"
        label="University Email"
        name="email"
        type="email"
        placeholder="you@siswa.um.edu.my"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        error={fieldErrors.email}
        required
      />
      <AuthInput
        id="password"
        label="Password"
        name="password"
        type="password"
        placeholder="Create a strong password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        error={fieldErrors.password}
        required
      />

      <p className="text-xs text-muted-foreground">Must be 8+ chars with uppercase, lowercase, number, and symbol (!@#$%^&*).</p>

      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
      ) : null}

      <SubmitButton label="Create account" pendingLabel="Creating account..." disabled={submitting || Boolean(success)} />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
