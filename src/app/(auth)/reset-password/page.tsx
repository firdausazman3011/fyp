import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" subtitle="Use a strong password different from your previous one.">
      <Suspense fallback={<p className="text-sm text-textSecondary">Loading reset form...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
