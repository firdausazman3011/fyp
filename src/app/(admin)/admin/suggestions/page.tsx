import { prisma } from "@/lib/prisma";
import { SuggestionFilterList } from "@/components/suggestions/SuggestionFilterList";

export default async function ReviewSuggestionsPage() {
  const suggestions = await prisma.suggestion.findMany({
    orderBy: { submittedAt: "desc" },
    include: { submittedBy: { select: { name: true, email: true } } },
  });

  const statusClass: Record<"PENDING" | "APPROVED" | "REJECTED" | "CONVERTED", string> = {
    PENDING: "border-transparent bg-amber-500/15 text-amber-800",
    APPROVED: "border-transparent bg-emerald-500/15 text-emerald-800",
    REJECTED: "border-transparent bg-destructive/15 text-destructive",
    CONVERTED: "border-transparent bg-blue-500/15 text-blue-800",
  };

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Review Suggestions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review, approve, reject, or convert user suggestions in a consistent workflow.
        </p>
      </div>
      <SuggestionFilterList
        suggestions={suggestions.map((suggestion) => ({
          ...suggestion,
          displayStatus: suggestion.convertedAt ? "CONVERTED" : suggestion.status,
          convertedDeleted: Boolean(suggestion.convertedAt && !suggestion.convertedToId),
        }))}
        statusClass={statusClass}
      />
    </section>
  );
}
