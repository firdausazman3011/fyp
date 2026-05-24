import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { ensureCsrfCookie } from "@/lib/security";

export default async function LoginPage() {
  const csrfToken = await ensureCsrfCookie();

  return (
    <AuthCard title="Welcome back" subtitle="Login with your account credentials.">
      <LoginForm csrfToken={csrfToken} />
    </AuthCard>
  );
}
