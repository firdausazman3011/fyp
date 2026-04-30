"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { fetchCsrfToken } from "@/lib/client-security";
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter } from "next/navigation";
import { AppImage } from "@/components/ui/AppImage";

type ProfileFormProps = {
  initialName: string;
  email: string;
  initialProfilePicture: string | null;
};

export function ProfileForm({ initialName, email, initialProfilePicture }: ProfileFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture ?? "");
  const [uploading, setUploading] = useState(false);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) throw new Error("Unable to upload image.");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        body: formData,
      });
      const data = (await response.json()) as { imageUrl?: string; error?: string };
      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error ?? "Upload failed.");
      }

      setProfilePicture(data.imageUrl);
      showToast("Profile picture uploaded. Save profile to apply it.", "success");
    } catch (uploadError) {
      showToast(uploadError instanceof Error ? uploadError.message : "Unable to upload image.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      showToast("Unable to update profile.", "error");
      return;
    }

    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ name, profilePicture }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      showToast(data.error ?? "Unable to update profile.", "error");
      return;
    }

    showToast(data.message ?? "Profile updated successfully.", "success");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border-2 border-[#6b4f3a] bg-white p-6 shadow-lg">
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary">Profile</h1>
        <p className="mt-2 text-sm text-textSecondary">
          Rule enforced: users can edit only their own profile data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-textPrimary">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-borderUi px-4 py-3 text-sm" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-textPrimary">Email</label>
          <input value={email} disabled className="w-full rounded-2xl border border-borderUi bg-mainBg px-4 py-3 text-sm text-textSecondary" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-textPrimary">Profile Picture</label>
        <div className="mb-3 flex items-center gap-4">
          <AppImage
            src={profilePicture || "/uploads/default-profile.svg"}
            alt={`${name} profile`}
            className="h-20 w-20 rounded-full border border-primary/10 object-cover"
            fallbackSrc="/uploads/default-profile.svg"
          />
          <div>
            <p className="text-sm font-medium text-textPrimary">Visible in View Profile and header</p>
            <p className="text-xs text-textSecondary">Supported types: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`, `.svg`</p>
          </div>
        </div>
        <input type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml" onChange={onFileChange} className="block w-full text-sm" />
        {uploading ? <p className="text-sm text-primary">Uploading picture...</p> : null}
        {profilePicture ? <p className="text-xs text-textSecondary">Selected image: {profilePicture}</p> : null}
      </div>

      <button type="submit" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg">
        Save Profile
      </button>
    </form>
  );
}
