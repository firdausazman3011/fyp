"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReviewSuggestionActions } from "@/components/suggestions/ReviewSuggestionActions";
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from "@/lib/date-format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["APPROVED", "PENDING", "REJECTED", "CONVERTED"] as const).map((item) => (
          <Button key={item} type="button" variant={filter === item ? "default" : "outline"} size="sm" onClick={() => setFilter(item)}>
            {item[0] + item.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((suggestion) => (
          <Card id={`admin-suggestion-${suggestion.id}`} key={suggestion.id} className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
              <CardTitle className="text-lg leading-snug">{suggestion.title}</CardTitle>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
                  statusClass[suggestion.displayStatus],
                )}
              >
                {suggestion.convertedDeleted ? "CONVERTED (DELETED)" : suggestion.displayStatus}
              </span>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="text-foreground/90">{suggestion.description}</p>
              <div className="grid gap-1">
                <p>
                  Submitted By: {suggestion.submittedBy.name} ({suggestion.submittedBy.email})
                </p>
                <p>Submitted On: {formatDateTimeDDMMYYYY(suggestion.submittedAt)}</p>
                <p>Suggested Location: {suggestion.location}</p>
                <p>Suggested Date: {formatDateDDMMYYYY(suggestion.date)}</p>
              </div>
              <ReviewSuggestionActions
                suggestionId={suggestion.id}
                status={suggestion.status}
                converted={Boolean(suggestion.convertedToId || suggestion.convertedAt)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Card className="border-dashed bg-muted/20 shadow-none">
          <CardContent className="py-6 text-sm text-muted-foreground">No suggestions available at the moment.</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
