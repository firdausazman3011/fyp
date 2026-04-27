import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthCard title="Create your UniConnect account" subtitle="Sign up with your student email to continue.">
      <SignupForm />
    </AuthCard>
  );
}
