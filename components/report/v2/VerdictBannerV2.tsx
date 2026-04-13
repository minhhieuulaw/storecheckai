"use client";

import { motion } from "framer-motion";
import type { Verdict } from "@/lib/types";
import { ScoreRingV2 } from "./ScoreRingV2";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay: 0.08, ease: EASE },
};

function getVerdictMeta(v: Verdict) {
  if (v === "BUY") {
    return {
      label: "BUY",
      subhead: "Safe to buy — trust signals check out.",
      color: "var(--v2-verdict-buy)",
    };
  }
  if (v === "SKIP") {
    return {
      label: "SKIP",
      subhead: "Avoid this store — multiple red flags detected.",
      color: "var(--v2-verdict-skip)",
    };
  }
  return {
    label: "CAUTION",
    subhead: "Proceed carefully — mixed signals.",
    color: "var(--v2-verdict-caution)",
  };
}

export function VerdictBannerV2({
  verdict,
  verdictReason,
  trustScore,
}: {
  verdict: Verdict;
  verdictReason: string;
  trustScore: number;
}) {
  const meta = getVerdictMeta(verdict);

  return (
    <motion.div
      {...fadeUp}
      className="h-full rounded-2xl p-6 flex flex-col justify-between"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${meta.color} 8%, var(--v2-surface-raised)) 0%, var(--v2-surface-raised) 100%)`,
        border: `1px solid color-mix(in srgb, ${meta.color} 25%, var(--v2-border))`,
        borderRadius: "var(--v2-radius-lg)",
        boxShadow: `0 0 48px color-mix(in srgb, ${meta.color} 10%, transparent), var(--v2-shadow-card)`,
      }}
    >
      {/* Top row: section chip + LIVE badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--v2-text-dim)" }}
        >
          02 · Verdict
        </span>
        <span
          className="inline-flex items-center gap-1 rounded px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "color-mix(in srgb, var(--v2-src-live) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--v2-src-live) 30%, transparent)",
            color: "var(--v2-src-live)",
          }}
        >
          ● Live
        </span>
      </div>

      {/* Verdict word + score ring */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2
            className="leading-none mb-2"
            style={{
              color: meta.color,
              fontFamily: "var(--v2-font-display)",
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            {meta.label}
          </h2>
          <p
            className="text-sm leading-snug"
            style={{ color: "var(--v2-text-secondary)" }}
          >
            {verdictReason || meta.subhead}
          </p>
        </div>

        <div className="shrink-0">
          <ScoreRingV2 score={trustScore} color={meta.color} size={96} />
        </div>
      </div>
    </motion.div>
  );
}
