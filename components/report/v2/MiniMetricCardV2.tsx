"use client";

import type { LucideIcon } from "lucide-react";

/**
 * MiniMetricCardV2 — 1 of 4 health snapshot cards.
 * Layout: icon + label (top), value (mono, large), Progress bar (4px, color-aligned).
 */
export function MiniMetricCardV2({
  Icon,
  label,
  value,
  pct,
  color,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  /** 0-100, drives the progress bar fill */
  pct: number;
  /** semantic color var, e.g. "var(--v2-success)" */
  color: string;
}) {
  const safePct = Math.max(0, Math.min(100, pct));

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2.5"
      style={{
        background: "var(--v2-surface-raised)",
        border: "1px solid var(--v2-border)",
        borderRadius: "var(--v2-radius-md)",
        boxShadow: "var(--v2-shadow-card)",
      }}
    >
      {/* Top row: icon + label */}
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-widest truncate"
          style={{ color: "var(--v2-text-muted)" }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div
        className="font-mono leading-none"
        style={{
          color: "var(--v2-text)",
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {value}
      </div>

      {/* Progress bar 4px */}
      <div
        className="w-full h-1 rounded-full overflow-hidden"
        style={{ background: "var(--v2-border)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${safePct}%`,
            background: color,
            transition: "width var(--v2-dur-slow) var(--v2-ease)",
          }}
        />
      </div>
    </div>
  );
}
