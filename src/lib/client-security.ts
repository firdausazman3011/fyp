export async function fetchCsrfToken() {
  const response = await fetch("/api/security/csrf", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { token?: string };
  return data.token ?? null;
}
