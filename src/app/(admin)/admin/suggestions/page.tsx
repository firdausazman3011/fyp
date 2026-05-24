import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { SuggestionFilterList } from "@/components/suggestions/SuggestionFilterList";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const statusClass: Record<"PENDING" | "APPROVED" | "REJECTED" | "CONVERTED", string> = {
  PENDING: "border-transparent bg-amber-500/15 text-amber-800",
  APPROVED: "border-transparent bg-emerald-500/15 text-emerald-800",
  REJECTED: "border-transparent bg-destructive/15 text-destructive",
  CONVERTED: "border-transparent bg-blue-500/15 text-blue-800",
};

export default function ReviewSuggestionsPage() {
  const statusClass: Record<"PENDING" | "APPROVED" | "REJECTED" | "CONVERTED", string> = {
    PENDING: "border-transparent bg-amber-500/15 text-amber-800",
    APPROVED: "border-transparent bg-emerald-500/15 text-emerald-800",
    REJECTED: "border-transparent bg-destructive/15 text-destructive",
    CONVERTED: "border-transparent bg-blue-500/15 text-blue-800",
  };

  return (
    <section className="page-stack">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Review Suggestions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review, approve, reject, or convert user suggestions in a consistent workflow.
        </p>
      </div>
      <Suspense fallback={<SuggestionListSkeleton />}>
        <SuggestionListSection statusClass={statusClass} />
      </Suspense>
    </section>
  );
}

async function SuggestionListSection({
  statusClass,
}: {
  statusClass: Record<"PENDING" | "APPROVED" | "REJECTED" | "CONVERTED", string>;
}) {
  const suggestions = await prisma.suggestion.findMany({
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      submittedAt: true,
      location: true,
      date: true,
      status: true,
      convertedToId: true,
      convertedAt: true,
      submittedBy: { select: { name: true, email: true } },
    },
  });

  return (
    <SuggestionFilterList
      suggestions={suggestions.map((suggestion) => ({
        ...suggestion,
        displayStatus: suggestion.convertedAt ? "CONVERTED" : suggestion.status,
        convertedDeleted: Boolean(suggestion.convertedAt && !suggestion.convertedToId),
      }))}
      statusClass={statusClass}
    />
  );
}

function SuggestionListSkeleton() {
  return (
    <div className="content-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="shadow-sm">
          <CardHeader className="space-y-3 pb-2">
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-10 w-28 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
