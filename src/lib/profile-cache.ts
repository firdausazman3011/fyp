import type { AuthPayload } from "@/lib/auth-jwt";

let cachedProfile: AuthPayload | null | undefined;

export function getCachedProfile() {
  return cachedProfile;
}

export function setCachedProfile(user: AuthPayload | null) {
  cachedProfile = user;
}

export function clearProfileCache() {
  cachedProfile = undefined;
}
