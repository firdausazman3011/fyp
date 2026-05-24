"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuthPayload } from "@/lib/auth-jwt";
import { getCachedProfile, setCachedProfile } from "@/lib/profile-cache";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { ProfileMenuSkeleton } from "@/components/layout/ProfileMenuSkeleton";

type ClientShellProfileProps = {
  role: "USER" | "ADMIN";
};

export function ClientShellProfile({ role }: ClientShellProfileProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthPayload | null | undefined>(() => getCachedProfile());

  useEffect(() => {
    function onProfileUpdated() {
      const cached = getCachedProfile();
      if (cached) setUser(cached);
    }
    window.addEventListener("uniconnect-profile-updated", onProfileUpdated);
    return () => window.removeEventListener("uniconnect-profile-updated", onProfileUpdated);
  }, []);

  useEffect(() => {
    const cached = getCachedProfile();
    if (cached !== undefined) {
      if (!cached) {
        router.replace("/login");
        return;
      }
      if (cached.role !== role) {
        router.replace(role === "ADMIN" ? "/home" : "/admin/dashboard");
        return;
      }
      setUser(cached);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (cancelled) return;

      if (!response.ok) {
        setCachedProfile(null);
        router.replace("/login");
        return;
      }

      const data = (await response.json()) as { user?: AuthPayload };
      const profile = data.user ?? null;
      setCachedProfile(profile);

      if (!profile) {
        router.replace("/login");
        return;
      }
      if (profile.role !== role) {
        router.replace(role === "ADMIN" ? "/home" : "/admin/dashboard");
        return;
      }

      setUser(profile);
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [role, router]);

  if (user === undefined || !user) {
    return <ProfileMenuSkeleton />;
  }

  return (
    <ProfileMenu role={role} name={user.name} email={user.email} profilePicture={user.profilePicture} />
  );
}
