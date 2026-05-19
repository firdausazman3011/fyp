import { serializeActivityDate } from "@/lib/date-format";
import { prisma } from "@/lib/prisma";
import { getCurrentAuthUser } from "@/lib/auth";
import { SuggestionForm } from "@/components/suggestions/SuggestionForm";
import { UserSuggestionList } from "@/components/suggestions/UserSuggestionList";

export default async function SuggestionsPage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const suggestions = await prisma.suggestion.findMany({
    where: { submittedById: authUser.userId },
    orderBy: { submittedAt: "desc" },
    include: { convertedTo: { select: { status: true } } },
  });

  const mappedSuggestions = suggestions.map((suggestion) => {
    const isConverted = Boolean(suggestion.convertedTo);
    const isCancelledByAdmin = suggestion.convertedTo?.status === "CANCELLED";
    const displayStatus = (isConverted ? (isCancelledByAdmin ? "CANCELLED" : "APPROVED") : suggestion.status) as
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | "CANCELLED";
    return {
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      date: serializeActivityDate(suggestion.date),
      location: suggestion.location,
      status: suggestion.status,
      displayStatus,
      adminRemark: suggestion.adminRemark,
      submittedAt: suggestion.submittedAt.toISOString(),
      convertedAt: suggestion.convertedAt?.toISOString() ?? null,
      convertedToId: suggestion.convertedToId,
      canModify: suggestion.status === "PENDING" && !isConverted,
    };
  });

  return (
    <section className="page-stack">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Activity Suggestion</h1>
        <p className="mt-2 text-sm text-muted-foreground">Propose activities for the community team to review.</p>
      </div>
      <SuggestionForm />
      <UserSuggestionList initialSuggestions={mappedSuggestions} />
    </section>
  );
}
