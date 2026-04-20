"use client";

import { motion } from "framer-motion";
import { Package, Truck, FileText, AlertTriangle, Clock } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay: 0.28, ease: EASE },
};

function riskColor(risk: "low" | "medium" | "high") {
  if (risk === "high") return "var(--v2-danger)";
  if (risk === "medium") return "var(--v2-warning)";
  return "var(--v2-success)";
}

export function LandedCostV2({
  cost,
}: {
  cost: {
    productPriceUsd: number;
    estimatedShippingUsd: number;
    estimatedDutyUsd: number;
    totalUsd: number;
    shippingTimeText: string;
    afterSalesRisk: "low" | "medium" | "high";
    note: string;
  };
}) {
  const rc = riskColor(cost.afterSalesRisk);

  return (
    <motion.div {...fadeUp}>
      {/* Section chip + badge */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--v2-text-dim)" }}
        >
          06 · Landed Cost
        </span>
        <span
          className="inline-flex items-center rounded px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "color-mix(in srgb, var(--v2-src-ai) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--v2-src-ai) 30%, transparent)",
            color: "var(--v2-src-ai)",
          }}
        >
          AI Estimate
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
        {/* Table header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--v2-border)" }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--v2-text-muted)" }}
          >
            Total Cost to Your Door (US)
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-mono"
            style={{ color: "var(--v2-text-muted)" }}
          >
            <Clock className="h-3 w-3" />
            {cost.shippingTimeText}
          </span>
        </div>

        {/* Breakdown table */}
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: "var(--v2-border)" }}>
          <CostCell Icon={Package} label="Product" value={cost.productPriceUsd} />
          <CostCell
            Icon={Truck}
            label="Shipping"
            value={cost.estimatedShippingUsd}
            freeLabel={cost.estimatedShippingUsd === 0 ? "Free*" : null}
          />
          <CostCell
            Icon={FileText}
            label="Import Duty"
            value={cost.estimatedDutyUsd}
            freeLabel={cost.estimatedDutyUsd === 0 ? "$0" : null}
          />
        </div>

        {/* Total row */}
        <div
          className="px-5 py-4 flex items-baseline justify-between"
          style={{
            background: "var(--v2-surface)",
            borderTop: "1px solid var(--v2-border)",
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--v2-text-muted)" }}
          >
            Estimated Total
          </span>
          <span
            className="font-mono leading-none"
            style={{
              color: "var(--v2-text)",
              fontFamily: "var(--v2-font-display)",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            ${cost.totalUsd.toFixed(2)}
          </span>
        </div>

        {/* After-sales risk warning */}
        <div
          className="px-5 py-3 flex items-start gap-2.5"
          style={{
            background: `color-mix(in srgb, ${rc} 6%, transparent)`,
            borderTop: `1px solid color-mix(in srgb, ${rc} 20%, transparent)`,
          }}
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0 mt-0.5"
            style={{ color: rc }}
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: rc }}
            >
              After-sales risk: {cost.afterSalesRisk}
            </p>
            <p
              className="text-xs leading-snug"
              style={{ color: "var(--v2-text-secondary)" }}
            >
              {cost.note}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CostCell({
  Icon,
  label,
  value,
  freeLabel,
}: {
  Icon: typeof Package;
  label: string;
  value: number;
  freeLabel?: string | null;
}) {
  return (
    <div className="px-4 py-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" style={{ color: "var(--v2-text-dim)" }} />
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--v2-text-muted)" }}
        >
          {label}
        </span>
      </div>
      <span
        className="font-mono leading-none"
        style={{
          color: freeLabel ? "var(--v2-text-muted)" : "var(--v2-text)",
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {freeLabel ?? `$${value.toFixed(2)}`}
      </span>
    </div>
  );
}
