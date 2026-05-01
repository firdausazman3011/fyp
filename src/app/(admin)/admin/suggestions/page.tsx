import { prisma } from "@/lib/prisma";
import { SuggestionFilterList } from "@/components/suggestions/SuggestionFilterList";

export default async function ReviewSuggestionsPage() {
  const suggestions = await prisma.suggestion.findMany({
    orderBy: { submittedAt: "desc" },
    include: { submittedBy: { select: { name: true, email: true } } },
  });

  const statusClass: Record<"PENDING" | "APPROVED" | "REJECTED" | "CONVERTED", string> = {
    PENDING: "bg-statusPending text-textPrimary",
    APPROVED: "bg-statusApproved text-textPrimary",
    REJECTED: "bg-statusRejected text-white",
    CONVERTED: "bg-blue-100 text-blue-700",
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary">Review Suggestions</h1>
        <p className="mt-2 text-sm text-textSecondary">Review, approve, reject, or convert user suggestions in a consistent workflow.</p>
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
