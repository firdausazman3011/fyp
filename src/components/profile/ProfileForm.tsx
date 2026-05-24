"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { clearProfileCache, getCachedProfile, setCachedProfile } from "@/lib/profile-cache";
import { fetchCsrfToken } from "@/lib/client-security";
import { uploadImageToStorage } from "@/lib/upload-image";
import { useToast } from "@/components/ui/ToastProvider";
import { AppImage } from "@/components/ui/AppImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  initialName: string;
  email: string;
  initialProfilePicture: string | null;
};

export function ProfileForm({ initialName, email, initialProfilePicture }: ProfileFormProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture ?? "");
  const [uploading, setUploading] = useState(false);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const imageUrl = await uploadImageToStorage(file);
      setProfilePicture(imageUrl);
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
    const data = (await response.json()) as {
      message?: string;
      error?: string;
      user?: { name: string; email: string; profilePicture: string | null };
    };
    if (!response.ok) {
      showToast(data.error ?? "Unable to update profile.", "error");
      return;
    }

    const cached = getCachedProfile();
    if (cached && data.user) {
      setCachedProfile({
        ...cached,
        name: data.user.name,
        profilePicture: data.user.profilePicture,
      });
    } else {
      clearProfileCache();
    }
    window.dispatchEvent(new Event("uniconnect-profile-updated"));
    showToast(data.message ?? "Profile updated successfully.", "success");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Profile</CardTitle>
        <CardDescription>Rule enforced: users can edit only their own profile data.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={email} disabled className="bg-muted text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center">
              <AppImage
                src={profilePicture || "/uploads/default-profile.svg"}
                alt={`${name} profile`}
                className="h-20 w-20 rounded-full border-2 border-border object-cover shadow-sm"
                fallbackSrc="/uploads/default-profile.svg"
              />
              <div>
                <p className="text-sm font-medium">Visible in View Profile and header</p>
                <p className="text-xs text-muted-foreground">Supported types: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`, `.svg`</p>
              </div>
            </div>
            <Input type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml" onChange={onFileChange} />
            {uploading ? <p className="text-sm text-primary">Uploading picture...</p> : null}
            {profilePicture ? <p className="text-xs text-muted-foreground">Selected image: {profilePicture}</p> : null}
          </div>

          <Button type="submit">Save Profile</Button>
        </form>
      </CardContent>
    </Card>
  );
}
