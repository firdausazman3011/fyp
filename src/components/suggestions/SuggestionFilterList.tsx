"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReviewSuggestionActions } from "@/components/suggestions/ReviewSuggestionActions";
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from "@/lib/date-format";

type SuggestionItem = {
  id: string;
  title: string;
  description: string;
  submittedAt: Date;
  location: string;
  date: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
  displayStatus: "PENDING" | "APPROVED" | "REJECTED" | "CONVERTED";
  submittedBy: { name: string; email: string };
  convertedToId: string | null;
  convertedAt?: Date | string | null;
  convertedDeleted?: boolean;
};

type Props = {
  suggestions: SuggestionItem[];
  statusClass: Record<SuggestionItem["displayStatus"], string>;
};

export function SuggestionFilterList({ suggestions, statusClass }: Props) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<"APPROVED" | "PENDING" | "REJECTED" | "CONVERTED">("PENDING");
  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus) return;
    const target = suggestions.find((item) => item.id === focus);
    if (target) {
      setFilter(target.displayStatus);
      requestAnimationFrame(() => {
        const element = document.getElementById(`admin-suggestion-${focus}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [searchParams, suggestions]);

  const filtered = useMemo(
    () => suggestions.filter((item) => item.displayStatus === filter),
    [suggestions, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["APPROVED", "PENDING", "REJECTED", "CONVERTED"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${filter === item ? "border-black bg-black text-white" : "border-black/30 bg-white text-textPrimary"}`}
          >
            {item[0] + item.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((suggestion) => (
          <article id={`admin-suggestion-${suggestion.id}`} key={suggestion.id} className="rounded-3xl border-2 border-[#6b4f3a] bg-cardBg p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xl font-semibold text-textPrimary">{suggestion.title}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[suggestion.displayStatus]}`}>
                {suggestion.convertedDeleted ? "CONVERTED (DELETED)" : suggestion.displayStatus}
              </span>
            </div>
            <p className="mt-2 text-sm text-textSecondary">{suggestion.description}</p>
            <div className="mt-4 grid gap-1 text-sm text-textSecondary">
              <p>Submitted By: {suggestion.submittedBy.name} ({suggestion.submittedBy.email})</p>
              <p>Submitted On: {formatDateTimeDDMMYYYY(suggestion.submittedAt)}</p>
              <p>Suggested Location: {suggestion.location}</p>
              <p>Suggested Date: {formatDateDDMMYYYY(suggestion.date)}</p>
            </div>
            <ReviewSuggestionActions
              suggestionId={suggestion.id}
              status={suggestion.status}
              converted={Boolean(suggestion.convertedToId || suggestion.convertedAt)}
            />
          </article>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border-2 border-[#6b4f3a] bg-white p-4 text-sm text-textSecondary shadow-sm">
          No suggestions available at the moment.
        </p>
      ) : null}
    </div>
  );
}
