import { Button } from "@/components/ui/button";

export function ProfileMenuSkeleton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled
      className="h-9 gap-2 rounded-full border-input pl-1 pr-3"
      aria-label="Loading profile"
    >
      <span className="h-7 w-7 animate-pulse rounded-full bg-muted" />
      <span className="hidden h-4 w-20 animate-pulse rounded bg-muted sm:inline" />
    </Button>
  );
}
