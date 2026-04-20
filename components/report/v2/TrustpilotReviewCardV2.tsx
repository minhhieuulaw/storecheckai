"use client";

import { Star } from "lucide-react";
import type { TrustpilotReview } from "@/lib/types";

export function TrustpilotReviewCardV2({ review }: { review: TrustpilotReview }) {
  const starColor =
    review.rating >= 4 ? "var(--v2-success)" :
    review.rating >= 3 ? "var(--v2-warning)" :
    "var(--v2-danger)";

  const initial = (review.author || "?").charAt(0).toUpperCase();
  const dateLabel = review.date === "Unknown" ? "—" : formatDate(review.date);

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2.5"
      style={{
        background: "var(--v2-surface)",
        border: "1px solid var(--v2-border)",
        borderRadius: "var(--v2-radius-md)",
      }}
    >
      {/* Author row */}
      <div className="flex items-center gap-2.5">
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: "var(--v2-surface-raised)",
            border: "1px solid var(--v2-border-strong)",
            color: "var(--v2-text-secondary)",
          }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--v2-text)" }}
          >
            {review.author || "Anonymous"}
          </p>
          <p
            className="text-[10px] font-mono"
            style={{ color: "var(--v2-text-dim)" }}
          >
            {dateLabel}
          </p>
        </div>
        <div className="flex gap-px shrink-0">
          {[1, 2, 3, 4, 5].map((s) => {
            const filled = s <= Math.round(review.rating);
            return (
              <Star
                key={s}
                className="h-3 w-3"
                style={{
                  color: filled ? starColor : "var(--v2-border-strong)",
                  fill: filled ? starColor : "transparent",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Review content */}
      <p
        className="text-sm leading-snug"
        style={{ color: "var(--v2-text-secondary)" }}
      >
        {review.content}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
