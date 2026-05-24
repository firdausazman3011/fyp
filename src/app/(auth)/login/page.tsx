import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Login with your account credentials.">
      <LoginForm />
    </AuthCard>
  );
}
