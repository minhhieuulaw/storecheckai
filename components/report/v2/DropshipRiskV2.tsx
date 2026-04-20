"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Zap, CheckCircle2, TrendingUp } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay: 0.24, ease: EASE },
};

type Level = "low" | "medium" | "high" | "critical";

function levelMeta(level: Level) {
  if (level === "critical") return {
    label: "Critical Markup", color: "var(--v2-danger)", Icon: AlertTriangle,
  };
  if (level === "high") return {
    label: "High Markup", color: "#F97316", Icon: AlertTriangle,
  };
  if (level === "medium") return {
    label: "Moderate Markup", color: "var(--v2-warning)", Icon: Zap,
  };
  return {
    label: "Fair Pricing", color: "var(--v2-success)", Icon: CheckCircle2,
  };
}

export function DropshipRiskV2({
  risk,
}: {
  risk: {
    markupScore: number;
    level: Level;
    storePriceUsd: number | null;
    aliMedianPriceUsd: number | null;
    markupMultiplier: number | null;
    evidence: string[];
    recommendation: string;
  };
}) {
  const meta = levelMeta(risk.level);
  const { Icon } = meta;

  return (
    <motion.div {...fadeUp}>
      {/* Section chip + badge */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--v2-text-dim)" }}
        >
          05 · Dropship Risk
        </span>
        <span
          className="inline-flex items-center rounded px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "color-mix(in srgb, var(--v2-src-hybrid) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--v2-src-hybrid) 30%, transparent)",
            color: "var(--v2-src-hybrid)",
          }}
        >
          Hybrid Estimate
        </span>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${meta.color} 6%, var(--v2-surface-raised)) 0%, var(--v2-surface-raised) 100%)`,
          border: `1px solid color-mix(in srgb, ${meta.color} 22%, var(--v2-border))`,
          borderRadius: "var(--v2-radius-lg)",
          boxShadow: "var(--v2-shadow-card)",
        }}
      >
        {/* Hero metric row */}
        <div className="flex items-start justify-between gap-6 mb-5">
          <div className="min-w-0 flex-1">
            {/* Level pill */}
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mb-3"
              style={{
                background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${meta.color} 28%, transparent)`,
              }}
            >
              <Icon className="h-3 w-3" style={{ color: meta.color }} />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
            </div>

            {/* Hero markup multiplier */}
            {risk.markupMultiplier != null ? (
              <div className="flex items-baseline gap-2">
                <span
                  className="leading-none"
                  style={{
                    color: meta.color,
                    fontFamily: "var(--v2-font-display)",
                    fontSize: 44,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {risk.markupMultiplier.toFixed(1)}×
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--v2-text-secondary)" }}
                >
                  markup vs. AliExpress median
                </span>
              </div>
            ) : (
              <div
                className="leading-none"
                style={{
                  color: meta.color,
                  fontFamily: "var(--v2-font-display)",
                  fontSize: 36,
                  fontWeight: 700,
                }}
              >
                {risk.markupScore}<span className="text-lg" style={{ color: "var(--v2-text-dim)" }}>/100</span>
              </div>
            )}

            {/* Price comparison */}
            {risk.storePriceUsd != null && risk.aliMedianPriceUsd != null && (
              <p
                className="mt-2 font-mono text-sm"
                style={{ color: "var(--v2-text-secondary)" }}
              >
                <span style={{ color: "var(--v2-text)" }}>${risk.storePriceUsd.toFixed(2)}</span>
                {" store · "}
                <span style={{ color: "var(--v2-success)" }}>${risk.aliMedianPriceUsd.toFixed(2)}</span>
                {" AliExpress"}
              </p>
            )}
          </div>

          {/* Circular score ring */}
          <div className="shrink-0">
            <ScoreGauge score={risk.markupScore} color={meta.color} />
          </div>
        </div>

        {/* Evidence chips */}
        {risk.evidence.length > 0 && (
          <div className="mb-5">
            <p
              className="text-[10px] uppercase tracking-widest mb-2"
              style={{ color: "var(--v2-text-dim)" }}
            >
              Evidence
            </p>
            <div className="flex flex-wrap gap-2">
              {risk.evidence.slice(0, 3).map((e, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]"
                  style={{
                    background: "var(--v2-surface)",
                    border: "1px solid var(--v2-border)",
                    color: "var(--v2-text-secondary)",
                  }}
                >
                  <TrendingUp
                    className="h-3 w-3 shrink-0"
                    style={{ color: "var(--v2-text-dim)" }}
                  />
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div
          className="rounded-lg p-3"
          style={{
            background: `color-mix(in srgb, ${meta.color} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${meta.color} 22%, transparent)`,
          }}
        >
          <p
            className="text-[10px] uppercase tracking-widest mb-1"
            style={{ color: meta.color }}
          >
            What to do
          </p>
          <p
            className="text-sm leading-snug"
            style={{ color: "var(--v2-text)" }}
          >
            {risk.recommendation}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const size = 72;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="absolute -rotate-90" width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--v2-border)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset var(--v2-dur-slow) var(--v2-ease)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="leading-none"
          style={{
            color,
            fontFamily: "var(--v2-font-display)",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {score}
        </span>
        <span
          className="mt-0.5 uppercase tracking-wider"
          style={{ color: "var(--v2-text-dim)", fontSize: 8, fontWeight: 600 }}
        >
          /100
        </span>
      </div>
    </div>
  );
}
