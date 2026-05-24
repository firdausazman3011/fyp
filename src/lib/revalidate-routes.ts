import { revalidatePath } from "next/cache";

/** Invalidate cached RSC payloads after mutations (avoids full client router.refresh where possible). */
export function revalidateActivityRoutes() {
  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/admin/dashboard");
  revalidatePath("/home");
}

export function revalidateSuggestionRoutes() {
  revalidatePath("/suggestions");
  revalidatePath("/admin/suggestions");
  revalidatePath("/admin/dashboard");
  revalidatePath("/home");
}
