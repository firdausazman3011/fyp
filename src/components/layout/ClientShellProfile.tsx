"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuthPayload } from "@/lib/auth";
import { getCachedProfile, setCachedProfile } from "@/lib/profile-cache";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { ProfileMenuSkeleton } from "@/components/layout/ProfileMenuSkeleton";

type ClientShellProfileProps = {
  role: "USER" | "ADMIN";
  initialUser?: AuthPayload | null;
};

export function ClientShellProfile({ role, initialUser = null }: ClientShellProfileProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthPayload | null | undefined>(() => {
    const cached = getCachedProfile();
    if (cached !== undefined) {
      return cached;
    }
    return initialUser;
  });

  useEffect(() => {
    if (initialUser !== undefined) {
      setCachedProfile(initialUser);
      setUser(initialUser);
    }
  }, [initialUser]);

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

    if (initialUser !== undefined) {
      if (!initialUser) {
        router.replace("/login");
        return;
      }
      if (initialUser.role !== role) {
        router.replace(role === "ADMIN" ? "/home" : "/admin/dashboard");
        return;
      }
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
  }, [initialUser, role, router]);

  if (user === undefined || !user) {
    return <ProfileMenuSkeleton />;
  }

  return (
    <ProfileMenu role={role} name={user.name} email={user.email} profilePicture={user.profilePicture} />
  );
}
