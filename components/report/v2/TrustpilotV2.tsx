"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ExternalLink, MessageSquareOff } from "lucide-react";
import type { TrustpilotReview } from "@/lib/types";
import { TrustpilotReviewCardV2 } from "./TrustpilotReviewCardV2";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay: 0.2, ease: EASE },
};

type Tab = "good" | "bad";

export function TrustpilotV2({
  rating,
  reviewCount,
  goodReviews,
  badReviews,
  domain,
}: {
  rating: number | null;
  reviewCount: number | null;
  goodReviews: TrustpilotReview[];
  badReviews: TrustpilotReview[];
  domain: string;
}) {
  const [tab, setTab] = useState<Tab>("good");

  if (rating == null) return null;

  const totalReviews = reviewCount ?? 0;
  const ratingColor =
    rating >= 4 ? "var(--v2-success)" :
    rating >= 3 ? "var(--v2-warning)" :
    "var(--v2-danger)";

  const activeReviews = tab === "good" ? goodReviews : badReviews;
  const isEmpty = activeReviews.length < 3;

  return (
    <motion.div {...fadeUp}>
      {/* Section chip + badge */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--v2-text-dim)" }}
        >
          04 · Trustpilot
        </span>
        <span
          className="inline-flex items-center rounded px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "color-mix(in srgb, var(--v2-src-scraped) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--v2-src-scraped) 30%, transparent)",
            color: "var(--v2-src-scraped)",
          }}
        >
          Live Scraped
        </span>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--v2-surface-raised)",
          border: "1px solid var(--v2-border)",
          borderRadius: "var(--v2-radius-lg)",
          boxShadow: "var(--v2-shadow-card)",
        }}
      >
        {/* Header: rating + view all */}
        <div className="px-6 pt-5 pb-4 flex items-end justify-between gap-4">
          <div className="flex items-end gap-3 min-w-0">
            <span
              className="leading-none"
              style={{
                color: "var(--v2-text)",
                fontFamily: "var(--v2-font-display)",
                fontSize: 48,
                fontWeight: 700,
              }}
            >
              {rating.toFixed(1)}
            </span>
            <div className="pb-1 min-w-0">
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((s) => {
                  const filled = s <= Math.round(rating);
                  return (
                    <Star
                      key={s}
                      className="h-3.5 w-3.5"
                      style={{
                        color: filled ? ratingColor : "var(--v2-border-strong)",
                        fill: filled ? ratingColor : "transparent",
                      }}
                    />
                  );
                })}
              </div>
              <span
                className="text-[11px] font-mono"
                style={{ color: "var(--v2-text-muted)" }}
              >
                {totalReviews.toLocaleString()} reviews
              </span>
            </div>
          </div>

          <a
            href={`https://www.trustpilot.com/review/${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: "var(--v2-text-muted)" }}
          >
            View all <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Tab switcher */}
        <div
          className="flex gap-1 px-6 pb-3"
          style={{ borderBottom: "1px solid var(--v2-border)" }}
        >
          <TabButton
            active={tab === "good"}
            onClick={() => setTab("good")}
            count={goodReviews.length}
            label="Good"
            color="var(--v2-success)"
          />
          <TabButton
            active={tab === "bad"}
            onClick={() => setTab("bad")}
            count={badReviews.length}
            label="Bad"
            color="var(--v2-danger)"
          />
        </div>

        {/* Review list */}
        <div className="px-6 py-4">
          {activeReviews.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeReviews.map((r, i) => (
                <TrustpilotReviewCardV2 key={i} review={r} />
              ))}
            </div>
          )}
          {isEmpty && activeReviews.length > 0 && (
            <p
              className="text-[11px] mt-3 text-center"
              style={{ color: "var(--v2-text-dim)" }}
            >
              Only {activeReviews.length} {tab} review{activeReviews.length === 1 ? "" : "s"} available. Check Trustpilot.com directly for the full picture.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all"
      style={{
        background: active ? `color-mix(in srgb, ${color} 10%, transparent)` : "transparent",
        border: active ? `1px solid color-mix(in srgb, ${color} 30%, transparent)` : "1px solid transparent",
        color: active ? color : "var(--v2-text-muted)",
      }}
    >
      {label}
      <span
        className="rounded-full px-1.5 py-0.5 text-[10px] font-mono"
        style={{
          background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : "var(--v2-surface)",
          color: active ? color : "var(--v2-text-dim)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center"
        style={{
          background: "var(--v2-surface)",
          border: "1px solid var(--v2-border)",
        }}
      >
        <MessageSquareOff
          className="h-5 w-5"
          style={{ color: "var(--v2-text-dim)" }}
        />
      </div>
      <p className="text-sm" style={{ color: "var(--v2-text-secondary)" }}>
        No {tab} reviews found.
      </p>
      <p className="text-xs" style={{ color: "var(--v2-text-dim)" }}>
        Cross-reference on Trustpilot.com for the full picture.
      </p>
    </div>
  );
}
