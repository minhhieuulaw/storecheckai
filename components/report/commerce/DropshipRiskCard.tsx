"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Zap } from "lucide-react";

export function DropshipRiskCard({ risk }: {
  risk: { markupScore: number; level: "low" | "medium" | "high" | "critical"; storePriceUsd: number | null; aliMedianPriceUsd: number | null; markupMultiplier: number | null; evidence: string[]; recommendation: string };
}) {
  const levelConfig = {
    critical: { label: "Critical Dropship Risk", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: AlertTriangle },
    high:     { label: "High Markup Risk",       color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: AlertTriangle },
    medium:   { label: "Moderate Markup",        color: "#eab308", bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)",   icon: Zap },
    low:      { label: "Fair Pricing",           color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",   icon: CheckCircle2 },
  };
  const cfg = levelConfig[risk.level];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-5 rounded-2xl overflow-hidden"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>

      {/* Header with markup score gauge */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mb-2"
            style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${cfg.border}` }}>
            <Icon className="h-3 w-3" style={{ color: cfg.color }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          {risk.markupMultiplier != null && risk.storePriceUsd != null && risk.aliMedianPriceUsd != null && (
            <p className="text-sm text-gray-300 leading-snug">
              Store charges{" "}
              <span className="font-bold text-white">${risk.storePriceUsd.toFixed(2)}</span>
              {" · AliExpress median "}
              <span className="font-bold text-green-400">${risk.aliMedianPriceUsd.toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* Markup score circular gauge */}
        <div className="shrink-0 text-right">
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={cfg.color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(risk.markupScore / 100) * 176} 176`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black" style={{ color: cfg.color }}>{risk.markupScore}</span>
              <span className="text-[8px] text-gray-600 uppercase tracking-wider">/100</span>
            </div>
          </div>
          {risk.markupMultiplier != null && risk.markupMultiplier >= 1.5 && (
            <p className="text-[10px] font-bold mt-1" style={{ color: cfg.color }}>
              {risk.markupMultiplier}× markup
            </p>
          )}
        </div>
      </div>

      {/* Evidence list */}
      {risk.evidence.length > 0 && (
        <div className="mx-5 mb-3 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Why we think this</p>
          <ul className="space-y-1.5">
            {risk.evidence.map((e, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-gray-300 leading-snug">
                <span className="text-gray-600 shrink-0">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What to do next */}
      <div className="mx-5 mb-4 rounded-xl px-3 py-2.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: cfg.color }}>What you should do</p>
        <p className="text-[12px] text-gray-200 leading-relaxed">{risk.recommendation}</p>
      </div>
    </motion.div>
  );
}
