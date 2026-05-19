import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  message: string;
  className?: string;
};

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <Card className={`w-full border-dashed bg-muted/20 shadow-none ${className ?? ""}`}>
      <CardContent className="flex min-h-[140px] w-full items-center justify-center px-6 py-8 text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
