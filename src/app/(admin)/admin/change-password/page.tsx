import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export default function AdminChangePasswordPage() {
  return (
    <ChangePasswordForm
      title="Admin Change Password"
      description="Rule enforced: admins can change their password without exposing profile-edit features."
    />
  );
}
