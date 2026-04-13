"use client";

import { motion } from "framer-motion";
import { RotateCcw, Star, Truck, CreditCard } from "lucide-react";
import type { Report } from "@/lib/types";
import { MiniMetricCardV2 } from "./MiniMetricCardV2";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay: 0.16, ease: EASE },
};

function returnMetric(risk: Report["returnRisk"]) {
  if (risk === "LOW")  return { value: "Easy",     pct: 90, color: "var(--v2-success)" };
  if (risk === "HIGH") return { value: "Difficult", pct: 25, color: "var(--v2-danger)"  };
  return                      { value: "Available", pct: 60, color: "var(--v2-warning)" };
}

function reviewMetric(rating: number | null, count: number | null) {
  if (rating == null || count == null || count === 0) {
    return { value: "No data", pct: 0, color: "var(--v2-text-dim)" };
  }
  const pct = Math.round((rating / 5) * 100);
  const color =
    rating >= 4 ? "var(--v2-success)" :
    rating >= 3 ? "var(--v2-warning)" :
    "var(--v2-danger)";
  return { value: `${rating.toFixed(1)} ★`, pct, color };
}

function shippingMetric(signals: string[]) {
  const s = signals ?? [];
  if (s.some((x) => x.startsWith("Ships from US"))) {
    return { value: "US",        pct: 90, color: "var(--v2-success)" };
  }
  if (s.some((x) => x.startsWith("Long shipping"))) {
    return { value: "Overseas",  pct: 35, color: "var(--v2-warning)" };
  }
  return { value: "Unknown",     pct: 40, color: "var(--v2-text-muted)" };
}

function paymentMetric(methods: string[]) {
  const m = methods ?? [];
  if (m.length >= 2) {
    return { value: m.slice(0, 2).join(" · "), pct: 90, color: "var(--v2-success)" };
  }
  if (m.length === 1) {
    return { value: m[0],            pct: 50, color: "var(--v2-warning)" };
  }
  return { value: "Unspecified",     pct: 15, color: "var(--v2-danger)"  };
}

export function HealthSnapshotV2({
  returnRisk,
  trustpilotRating,
  trustpilotReviewCount,
  shippingOriginSignals,
  paymentMethods,
}: {
  returnRisk: Report["returnRisk"];
  trustpilotRating: number | null;
  trustpilotReviewCount: number | null;
  shippingOriginSignals: string[];
  paymentMethods: string[];
}) {
  const ret  = returnMetric(returnRisk);
  const rev  = reviewMetric(trustpilotRating, trustpilotReviewCount);
  const ship = shippingMetric(shippingOriginSignals);
  const pay  = paymentMetric(paymentMethods);

  return (
    <motion.div {...fadeUp}>
      {/* Section chip */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--v2-text-dim)" }}
        >
          03 · Health Snapshot
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

      {/* 4-col grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniMetricCardV2 Icon={RotateCcw}  label="Return"   value={ret.value}  pct={ret.pct}  color={ret.color}  />
        <MiniMetricCardV2 Icon={Star}       label="Reviews"  value={rev.value}  pct={rev.pct}  color={rev.color}  />
        <MiniMetricCardV2 Icon={Truck}      label="Shipping" value={ship.value} pct={ship.pct} color={ship.color} />
        <MiniMetricCardV2 Icon={CreditCard} label="Payment"  value={pay.value}  pct={pay.pct}  color={pay.color}  />
      </div>
    </motion.div>
  );
}
