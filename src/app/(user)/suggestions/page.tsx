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
      date: suggestion.date.toISOString(),
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
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Activity Suggestion</h1>
      <SuggestionForm />
      <UserSuggestionList initialSuggestions={mappedSuggestions} />
    </section>
  );
}
