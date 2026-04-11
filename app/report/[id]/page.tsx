"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, AlertCircle,
  ExternalLink, Star, ChevronDown, ChevronUp, ShoppingCart,
  Truck, ShieldCheck, Tag, Shield, Package, Sparkles, Zap,
} from "lucide-react";
import type { Report, RiskLevel, Verdict, StoreSignal, PriceVerdict, DeepProductIntel } from "@/lib/types";
import FBAdChecker from "@/components/FBAdChecker";
import { SectionHeader } from "@/components/report/layout/SectionHeader";
import { LockedSection } from "@/components/report/common/LockedSection";
import { ErrorState } from "@/components/report/common/ErrorState";
import { TrustpilotPanel } from "@/components/report/trust/TrustpilotPanel";
import { ProsAndCons } from "@/components/report/guidance/ProsAndCons";
import { ReturnPolicy } from "@/components/report/guidance/ReturnPolicy";
import { WhoShouldBuyAvoid } from "@/components/report/guidance/WhoShouldBuyAvoid";
import { FinalTake } from "@/components/report/guidance/FinalTake";
import { ReportNavbar } from "@/components/report/layout/ReportNavbar";
import { ReportFooter } from "@/components/report/layout/ReportFooter";
import { MobileStickyVerdictBar } from "@/components/report/layout/MobileStickyVerdictBar";
import { PartialDataWarning } from "@/components/report/status/PartialDataWarning";
import { BlacklistWarning } from "@/components/report/status/BlacklistWarning";
import { NonDeliveryRiskWarning } from "@/components/report/status/NonDeliveryRiskWarning";
import { StoreHero } from "@/components/report/hero/StoreHero";
import { VerdictBanner } from "@/components/report/hero/VerdictBanner";
import { HealthSnapshot } from "@/components/report/status/HealthSnapshot";

// ─── Motion presets ───────────────────────────────────────────────────────────
const EASE = [0.4, 0, 0.2, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE },
};

const fadeUpDelayed = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});

const viewportOnce = { once: true };

// ─── Skeleton component ───────────────────────────────────────────────────────
function Sk({ h = "h-4", w = "w-full", r = "rounded-xl" }: { h?: string; w?: string; r?: string }) {
  return (
    <div
      className={`${h} ${w} ${r} skeleton`}
      aria-hidden="true"
    />
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen" style={{ background: "#07070f" }}>
      {/* Skeleton navbar */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(7,7,15,0.92)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}>
        <Sk h="h-4" w="w-36" r="rounded-lg" />
        <div className="flex gap-2">
          <Sk h="h-8" w="w-20" r="rounded-xl" />
          <Sk h="h-8" w="w-32" r="rounded-xl" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-4">
        {/* Store hero skeleton */}
        <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          <Sk h="h-40" r="rounded-none" />
          <div className="flex items-center gap-4 px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <Sk h="h-9" w="w-9" r="rounded-xl" />
            <div className="flex-1 space-y-2">
              <Sk h="h-4" w="w-40" />
              <Sk h="h-3" w="w-28" />
            </div>
          </div>
        </div>

        {/* Verdict banner skeleton */}
        <div className="rounded-3xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-4">
            <Sk h="h-14" w="w-14" r="rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Sk h="h-5" w="w-32" />
              <Sk h="h-3" w="w-full" />
              <Sk h="h-3" w="w-4/5" />
            </div>
            <Sk h="h-16" w="w-16" r="rounded-full" />
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            <Sk h="h-8" w="w-28" r="rounded-xl" />
            <Sk h="h-8" w="w-28" r="rounded-xl" />
            <Sk h="h-8" w="w-28" r="rounded-xl" />
            <Sk h="h-8" w="w-24" r="rounded-xl" />
          </div>
        </div>

        {/* Health buckets skeleton */}
        <div className="grid grid-cols-3 gap-3">
          <Sk h="h-16" r="rounded-2xl" />
          <Sk h="h-16" r="rounded-2xl" />
          <Sk h="h-16" r="rounded-2xl" />
        </div>

        {/* Pros/cons skeleton */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Sk h="h-44" r="rounded-2xl" />
          <Sk h="h-44" r="rounded-2xl" />
        </div>

        {/* Return policy + bottom sections */}
        <Sk h="h-28" r="rounded-2xl" />
        <Sk h="h-32" r="rounded-2xl" />
        <Sk h="h-24" r="rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Config helpers ───────────────────────────────────────────────────────────
function getVerdictConfig(v: Verdict) {
  if (v === "BUY") return {
    label: "Safe to Buy", color: "#4ade80",
    bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.18)", glow: "rgba(34,197,94,0.1)",
    Icon: CheckCircle2,
  };
  if (v === "SKIP") return {
    label: "Avoid This Store", color: "#f87171",
    bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.18)", glow: "rgba(239,68,68,0.1)",
    Icon: XCircle,
  };
  return {
    label: "Use Caution", color: "#fbbf24",
    bg: "rgba(234,179,8,0.07)", border: "rgba(234,179,8,0.18)", glow: "rgba(234,179,8,0.08)",
    Icon: AlertTriangle,
  };
}

function getReturnPill(risk: RiskLevel) {
  if (risk === "LOW")  return { text: "Easy Returns",       color: "#4ade80" };
  if (risk === "HIGH") return { text: "Returns Difficult",  color: "#f87171" };
  return                      { text: "Returns Available",  color: "#fbbf24" };
}

function getShippingPill(signals: string[]) {
  const s = signals ?? [];
  if (s.some(x => x.startsWith("Long shipping"))) return { text: "Ships Overseas", color: "#fbbf24" };
  if (s.some(x => x.startsWith("Ships from US"))) return { text: "Ships from US",  color: "#4ade80" };
  return { text: "Shipping Unknown", color: "#6b7280" };
}

function priceVerdictConfig(v: PriceVerdict, exactMatch?: boolean) {
  if (v === "cheap")      return { label: "Good Deal",   color: "#4ade80", bg: "rgba(34,197,94,0.12)"  };
  if (v === "fair")       return { label: "Fair Price",  color: "#38bdf8", bg: "rgba(56,189,248,0.12)" };
  if (v === "overpriced") return { label: exactMatch ? "Overpriced" : "Cheaper Alternatives", color: "#fbbf24", bg: "rgba(234,179,8,0.12)" };
  return                         { label: "High Markup", color: "#f87171", bg: "rgba(239,68,68,0.12)"  };
}

function scoreColor(s: number) {
  if (s >= 65) return "#4ade80";
  if (s >= 40) return "#fbbf24";
  return "#f87171";
}

function scoreLabel(s: number) {
  if (s >= 75) return "High";
  if (s >= 50) return "Medium";
  if (s >= 30) return "Low";
  return "Very Low";
}

// ─── DropshipRiskCard ─────────────────────────────────────────────────────────

function DropshipRiskCard({ risk }: {
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

// ─── LandedCostCard ───────────────────────────────────────────────────────────

function LandedCostCard({ cost }: {
  cost: { productPriceUsd: number; estimatedShippingUsd: number; estimatedDutyUsd: number; totalUsd: number; shippingTimeText: string; afterSalesRisk: "low" | "medium" | "high"; note: string };
}) {
  const riskColor = cost.afterSalesRisk === "high" ? "#ef4444" : cost.afterSalesRisk === "medium" ? "#eab308" : "#22c55e";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-5 rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>

      <div className="px-5 pt-4 pb-3">
        <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mb-3"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <Package className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Total Cost to Your Door (US)</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Product</p>
            <p className="text-sm font-bold text-white">${cost.productPriceUsd.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Shipping</p>
            <p className="text-sm font-bold text-gray-300">
              {cost.estimatedShippingUsd > 0 ? `$${cost.estimatedShippingUsd.toFixed(2)}` : "Free*"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Import Duty</p>
            <p className="text-sm font-bold text-gray-300">
              {cost.estimatedDutyUsd > 0 ? `$${cost.estimatedDutyUsd.toFixed(2)}` : "$0"}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Estimated Total</p>
            <p className="text-lg font-black text-white">${cost.totalUsd.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Shipping time</p>
            <p className="text-xs font-semibold text-gray-300">{cost.shippingTimeText}</p>
          </div>
        </div>
      </div>

      {/* After-sales warning */}
      <div className="px-5 pb-4">
        <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
          style={{ background: `${riskColor}0d`, border: `1px solid ${riskColor}33` }}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: riskColor }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: riskColor }}>
              After-sales risk: {cost.afterSalesRisk}
            </p>
            <p className="text-[11px] text-gray-300 leading-snug">{cost.note}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ProductIntelCard ─────────────────────────────────────────────────────────

function ProductIntelCard({ intel }: { intel: DeepProductIntel }) {
  const isBundle = intel.pageType === "bundle_kit" && intel.bundleComponents.length > 0;
  const isFunnel = intel.pageType === "funnel_quiz";
  const hasDiscount = intel.discountPercent != null && intel.discountPercent > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-4 rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(59,130,246,0.03) 100%)", border: "1px solid rgba(139,92,246,0.12)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mb-2.5"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
            {isBundle ? <Package className="h-3 w-3 text-violet-400" /> : isFunnel ? <Zap className="h-3 w-3 text-amber-400" /> : <Sparkles className="h-3 w-3 text-violet-400" />}
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
              {isBundle ? "Bundle Breakdown" : isFunnel ? "Funnel Store" : "Product Details"}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-200 leading-snug">
            {intel.brand && <span className="text-violet-400">{intel.brand} </span>}
            {intel.productName}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{intel.category}{intel.limitedEdition ? " · Limited Edition" : ""}</p>
        </div>

        {/* Price badge */}
        {intel.currentPrice != null && (
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-white">${intel.currentPrice}</p>
            {intel.originalPrice != null && hasDiscount && (
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[11px] text-gray-600 line-through">${intel.originalPrice}</span>
                <span className="text-[10px] font-bold text-green-400 px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(34,197,94,0.1)" }}>
                  {intel.discountPercent}% off
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bundle components */}
      {isBundle && (
        <div className="mx-5 mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-3 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">What&apos;s inside</p>
          </div>
          {intel.bundleComponents.map((comp, i) => (
            <div key={i} className="px-3 py-2 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded flex items-center justify-center text-[9px] font-bold text-violet-400"
                  style={{ background: "rgba(139,92,246,0.1)" }}>{i + 1}</div>
                <span className="text-xs text-gray-300">{comp.name}</span>
                {comp.size && <span className="text-[10px] text-gray-600">({comp.size})</span>}
              </div>
              {comp.fullSizePriceEstimate && (
                <span className="text-[10px] text-gray-600">~{comp.fullSizePriceEstimate} full size</span>
              )}
            </div>
          ))}
          {intel.bundleTotalValue && (
            <div className="px-3 py-2 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(34,197,94,0.03)" }}>
              <span className="text-[11px] font-medium text-green-400">Total value: {intel.bundleTotalValue}</span>
              {intel.bundleSavings && <span className="text-[11px] font-bold text-green-400">{intel.bundleSavings}</span>}
            </div>
          )}
        </div>
      )}

      {/* Details grid — marketing claims removed (non-trust data) */}
      <div className="px-5 pb-4 flex flex-wrap gap-x-4 gap-y-2">
        {intel.targetConcerns.length > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Best for</p>
            <div className="flex flex-wrap gap-1">
              {intel.targetConcerns.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full text-blue-300"
                  style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>{c}</span>
              ))}
            </div>
          </div>
        )}
        {intel.ingredients.length > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Key ingredients</p>
            <p className="text-[11px] text-gray-400">{intel.ingredients.slice(0, 6).join(" · ")}</p>
          </div>
        )}
        {intel.onPageRating != null && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">On-site rating</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-amber-400">{intel.onPageRating}</span>
              {intel.onPageReviewCount != null && (
                <span className="text-[10px] text-gray-600">({intel.onPageReviewCount.toLocaleString()} reviews)</span>
              )}
            </div>
          </div>
        )}
        {intel.funnelSignals.length > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Store signals</p>
            <div className="flex flex-wrap gap-1">
              {intel.funnelSignals.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full text-gray-400"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Funnel warning */}
      {isFunnel && (
        <div className="mx-5 mb-4 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <p className="text-[11px] text-amber-400">
            <Zap className="inline h-3 w-3 mr-1" />
            This store uses a quiz/funnel to sell — the actual product may differ from what you see initially.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── AliExpressRecommendations ────────────────────────────────────────────────

function AliExpressRecommendations({ recommendations }: {
  recommendations: { productId: string; name: string; price: string; priceNumeric: number; rating: number | null; ordersText: string; imageUrl: string | null; productUrl: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-5">
      <SectionHeader label="Cheaper on AliExpress" badge="Live Data" />

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(239,68,68,0.01) 100%)", border: "1px solid rgba(239,68,68,0.12)" }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2.5"
          style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
          <ShoppingCart className="h-4 w-4 text-red-400" />
          <span className="text-sm font-semibold text-red-300">
            {recommendations.length} wholesale alternatives
          </span>
          <span className="ml-auto text-[10px] font-medium text-green-500 px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(34,197,94,0.08)" }}>
            Direct product links
          </span>
        </div>

        {/* Product cards */}
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {recommendations.map((rec, i) => (
            <a
              key={rec.productId}
              href={rec.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 px-4 py-3.5 transition-all hover:bg-white/[0.04] group"
              style={{ borderBottom: i < recommendations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>

              {/* Thumbnail with rank badge */}
              <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: rec.imageUrl ? "rgba(255,255,255,0.95)" : "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  {rec.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rec.imageUrl} alt={rec.name} className="h-full w-full object-contain p-1" loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <ShoppingCart className="h-6 w-6 text-red-500/40" />
                  )}
                </div>
                <div className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: i === 0 ? "linear-gradient(135deg, #ef4444, #f87171)" : i === 1 ? "linear-gradient(135deg, #94a3b8, #cbd5e1)" : "rgba(255,255,255,0.1)",
                    color: i <= 1 ? "#000" : "#999",
                    border: "2px solid rgba(10,10,20,1)",
                  }}>
                  {i + 1}
                </div>
              </div>

              {/* Product details */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-200 leading-snug mb-1.5 group-hover:text-red-300 transition-colors line-clamp-2">
                  {rec.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {rec.rating != null && (
                    <div className="flex items-center gap-1">
                      <div className="flex gap-px">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className="h-2.5 w-2.5"
                            style={{ color: s <= Math.round(rec.rating!) ? "#f59e0b" : "rgba(255,255,255,0.1)", fill: s <= Math.round(rec.rating!) ? "#f59e0b" : "transparent" }} />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-amber-400">{rec.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <span className="text-xs font-bold text-green-400 px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(34,197,94,0.08)" }}>
                    {rec.price}
                  </span>
                  {rec.ordersText && (
                    <span className="text-[10px] font-medium text-red-400 px-1.5 py-0.5 rounded-md"
                      style={{ background: "rgba(239,68,68,0.08)" }}>
                      {rec.ordersText}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all group-hover:bg-red-500/10"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <ExternalLink className="h-3.5 w-3.5 text-gray-600 group-hover:text-red-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── AmazonRecommendations ────────────────────────────────────────────────────

function AmazonRecommendations({ recommendations }: {
  recommendations: { name: string; estimatedPrice: string; rating: number; reviewCount: string; whyBuy: string; searchUrl: string; asin?: string; productUrl?: string; imageUrl?: string; isPrime?: boolean; isBestSeller?: boolean; source?: "amazon-live" | "ai-estimated" }[];
}) {
  const isLive = recommendations[0]?.source === "amazon-live";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-5">
      <SectionHeader
        label={isLive ? "Top Alternatives Worth Checking Out" : "Suggested Search Alternatives"}
        badge={isLive ? "Live Amazon Data" : "AI Suggestions"}
      />

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,153,0,0.03) 0%, rgba(255,200,50,0.02) 100%)", border: "1px solid rgba(255,153,0,0.12)" }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2.5"
          style={{ background: "rgba(255,153,0,0.06)", borderBottom: "1px solid rgba(255,153,0,0.1)" }}>
          <ShoppingCart className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">
            {isLive
              ? `${recommendations.length} verified Amazon alternatives`
              : `${recommendations.length} filtered Amazon searches`}
          </span>
          {isLive ? (
            <span className="ml-auto text-[10px] font-medium text-green-500 px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(34,197,94,0.08)" }}>
              Direct product links
            </span>
          ) : (
            <span className="ml-auto text-[10px] font-medium text-gray-500 px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              Price-filtered search
            </span>
          )}
        </div>

        {/* Product cards */}
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {recommendations.map((rec, i) => (
            <a
              key={i}
              href={rec.productUrl || rec.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 px-4 py-3.5 transition-all hover:bg-white/[0.04] group"
              style={{ borderBottom: i < recommendations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>

              {/* Thumbnail with rank badge */}
              <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: rec.imageUrl ? "rgba(255,255,255,0.95)" : "rgba(255,153,0,0.08)", border: "1px solid rgba(255,153,0,0.15)" }}>
                  {rec.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rec.imageUrl} alt={rec.name} className="h-full w-full object-contain p-1" loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<svg class="h-6 w-6 text-amber-500/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'; }} />
                  ) : (
                    <ShoppingCart className="h-6 w-6 text-amber-500/40" />
                  )}
                </div>
                {/* Rank badge */}
                <div className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: i === 0 ? "linear-gradient(135deg, #ff9900, #ffb347)" : i === 1 ? "linear-gradient(135deg, #94a3b8, #cbd5e1)" : "rgba(255,255,255,0.1)",
                    color: i <= 1 ? "#000" : "#999",
                    border: "2px solid rgba(10,10,20,1)",
                  }}>
                  {i + 1}
                </div>
              </div>

              {/* Product details */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-200 leading-snug mb-1.5 group-hover:text-amber-300 transition-colors line-clamp-2">
                  {rec.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {/* Stars */}
                  <div className="flex items-center gap-1">
                    <div className="flex gap-px">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="h-2.5 w-2.5"
                          style={{ color: s <= Math.round(rec.rating) ? "#f59e0b" : "rgba(255,255,255,0.1)", fill: s <= Math.round(rec.rating) ? "#f59e0b" : "transparent" }} />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-amber-400">{rec.rating}</span>
                    <span className="text-[10px] text-gray-600">({rec.reviewCount})</span>
                  </div>
                  {/* Price pill */}
                  <span className="text-xs font-bold text-green-400 px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(34,197,94,0.08)" }}>
                    {rec.estimatedPrice}
                  </span>
                  {/* Badges */}
                  {rec.isPrime && (
                    <span className="text-[10px] font-medium text-blue-400 px-1.5 py-0.5 rounded-md"
                      style={{ background: "rgba(59,130,246,0.08)" }}>
                      Prime
                    </span>
                  )}
                  {rec.isBestSeller && (
                    <span className="text-[10px] font-medium text-orange-400 px-1.5 py-0.5 rounded-md"
                      style={{ background: "rgba(249,115,22,0.08)" }}>
                      Best Seller
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{rec.whyBuy}</p>
              </div>

              {/* CTA arrow */}
              <div className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all group-hover:bg-amber-500/10"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <ExternalLink className="h-3.5 w-3.5 text-gray-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,153,0,0.08)" }}>
          <p className="text-[10px] text-gray-600">
            Links may earn us a small commission at no extra cost to you.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const [report,      setReport]      = useState<Report | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [showTech,    setShowTech]    = useState(false);
  const [isLoggedIn,  setIsLoggedIn]  = useState<boolean | null>(null);
  const [scamWarnings, setScamWarnings] = useState<{ id: string; content: string; createdAt: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    const reportP = fetch(`/api/report/${id}`).then(r => r.json());
    const loginP  = fetch("/api/auth/me", { credentials: "include" }).then(r => r.ok).catch(() => false);
    Promise.all([reportP, loginP])
      .then(([data, loggedIn]) => {
        setIsLoggedIn(loggedIn as boolean);
        if (data.error) { setError(data.error); return; }
        setReport(data as Report);
        const domain = (data as Report).domain;
        if (domain) {
          fetch(`/api/scam-reports/domain?d=${encodeURIComponent(domain)}`)
            .then(r => r.json())
            .then(d => setScamWarnings(d.reports ?? []))
            .catch(() => {});
        }
      })
      .catch(() => setError("Failed to load report."));
  }, [id]);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share && report) {
      try {
        await navigator.share({
          title: `${report.storeName} — StorecheckAI`,
          text: `Trust score: ${report.trustScore}/100 · Verdict: ${report.verdict}`,
          url,
        });
        return;
      } catch { /* user cancelled share */ }
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error)   return <ErrorState message={error} />;
  if (!report) return <LoadingState />;

  const isBasicPlan = report.planUsed === "starter" || report.planUsed === "free";

  // Groupings
  const passing  = report.storeSignals.filter(s => s.status === "pass");
  const warnings = report.storeSignals.filter(s => s.status === "warn" || s.status === "unknown");
  const failures = report.storeSignals.filter(s => s.status === "fail");

  const vc           = getVerdictConfig(report.verdict);
  const returnPill   = getReturnPill(report.returnRisk);
  const shippingPill = getShippingPill(report.shippingOriginSignals ?? []);
  const payments     = report.paymentMethods ?? [];
  const paymentText  = payments.length >= 2
    ? payments.slice(0, 2).join(" · ")
    : payments.length === 1 ? payments[0] : "Payment unspecified";
  const paymentColor = payments.length >= 2 ? "#4ade80" : payments.length === 1 ? "#fbbf24" : "#6b7280";
  const trustColor   = scoreColor(report.trustScore);

  return (
    <div className="min-h-screen" style={{ background: "#07070f" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <ReportNavbar isLoggedIn={isLoggedIn} copied={copied} onShare={handleShare} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* ── PARTIAL DATA WARNING ────────────────────────────────────────── */}
        {report.isPartialData && <PartialDataWarning />}

        {/* ── BLACKLIST WARNING ───────────────────────────────────────────── */}
        <BlacklistWarning warnings={scamWarnings} />

        {/* ── NON-DELIVERY RISK WARNING ───────────────────────────────────── */}
        <NonDeliveryRiskWarning show={!!report.nonDeliveryRisk} scamPatterns={report.scamPatterns} />

        {/* ── STORE HERO ──────────────────────────────────────────────────── */}
        <StoreHero
          storeName={report.storeName}
          url={report.url}
          domain={report.domain}
          analyzedAt={report.analyzedAt}
        />

        {/* ── VERDICT BANNER ──────────────────────────────────────────────── */}
        <VerdictBanner
          verdictConfig={vc}
          verdictReason={report.verdictReason}
          trustScore={report.trustScore}
          trustColor={trustColor}
          trustLabel={scoreLabel(report.trustScore)}
          returnPill={returnPill}
          shippingPill={shippingPill}
          paymentText={paymentText}
          paymentColor={paymentColor}
        />

        {/* ── HEALTH SNAPSHOT ─────────────────────────────────────────────── */}
        <HealthSnapshot passing={passing} warnings={warnings} failures={failures} />

        {/* ── TRUSTPILOT ──────────────────────────────────────────────────── */}
        <TrustpilotPanel report={report} isBasicPlan={isBasicPlan} />

        {/* ── DROPSHIP RISK (US market) ─────────────────────────────────── */}
        {(() => {
          const risk = (report as unknown as { dropshipRisk?: { markupScore: number; level: "low" | "medium" | "high" | "critical"; storePriceUsd: number | null; aliMedianPriceUsd: number | null; markupMultiplier: number | null; evidence: string[]; recommendation: string } }).dropshipRisk;
          if (!risk) return null;
          return <DropshipRiskCard risk={risk} />;
        })()}

        {/* ── LANDED COST (US) ──────────────────────────────────────────── */}
        {(() => {
          const cost = (report as unknown as { landedCost?: { productPriceUsd: number; estimatedShippingUsd: number; estimatedDutyUsd: number; totalUsd: number; shippingTimeText: string; afterSalesRisk: "low" | "medium" | "high"; note: string } }).landedCost;
          if (!cost) return null;
          return <LandedCostCard cost={cost} />;
        })()}

        {/* ── PRODUCT INTELLIGENCE ─────────────────────────────────────── */}
        {report.productIntel && report.productIntel.pageType !== "unknown" && (
          <ProductIntelCard intel={report.productIntel} />
        )}

        {/* ── PRICE CHECK ─────────────────────────────────────────────────── */}
        {isBasicPlan && <LockedSection label="Price Comparison (Amazon · AliExpress)" />}
        {!isBasicPlan && (report.priceAnalysis ?? []).length === 0 && (report.products ?? []).length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4 }}
            className="mb-5">
            <SectionHeader label="Price Check" badge="GPT-4o Vision" />
            <div className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm text-gray-500">No product listings detected on this store.</p>
              <p className="text-xs text-gray-700 mt-1">Price comparison is available when the store exposes product data.</p>
            </div>
          </motion.div>
        )}
        {!isBasicPlan && (report.priceAnalysis ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4 }}
            className="mb-5">
            <SectionHeader label="Price Check" badge="GPT-4o Vision" />

            <div className="space-y-3">
              {(report.priceAnalysis ?? []).map((item, i) => {
                const isExact = (item as unknown as { exactMatch?: boolean }).exactMatch !== false;
                const pvc     = priceVerdictConfig(item.priceVerdict, isExact);
                const product = (report.products ?? []).find(p => p.name === item.productName);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                    className="group rounded-2xl overflow-hidden transition-all"
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.02)",
                    }}>
                    <div className="flex gap-4 p-4">
                      {/* Product image */}
                      {product?.image && (
                        <div
                          className="shrink-0 h-24 w-24 rounded-xl overflow-hidden"
                          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image} alt={item.identifiedAs}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Name + badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-200 leading-tight">{item.identifiedAs}</p>
                            {!isExact && (
                              <p className="text-[10px] text-gray-500 mt-0.5">Compared with similar products — not an exact match</p>
                            )}
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: pvc.bg, color: pvc.color }}>
                            {pvc.label}
                          </span>
                        </div>
                        {/* Prices */}
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">This Store</span>
                            <span className="text-sm font-bold text-gray-100">{item.storePrice}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                              {isExact ? "Amazon" : "Amazon (similar)"}
                            </span>
                            <span className="text-sm font-semibold" style={{ color: pvc.color }}>{item.estimatedMarketPrice}</span>
                          </div>
                          {item.aliexpressPrice && (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                                {isExact ? "AliExpress" : "AliExpress (similar)"}
                              </span>
                              <span className="text-sm font-semibold text-gray-500">{item.aliexpressPrice}</span>
                              {item.aliexpressPriceSource === "live" ? (
                                <span
                                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider"
                                  title={`Live price sampled from ${item.aliexpressSampleCount} AliExpress products via Official API`}
                                  style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.32)", color: "#34d399" }}>
                                  ● Live
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center rounded px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider"
                                  title="AI estimate from GPT-4o Vision based on similar products — not a live scrape. Actual prices may differ."
                                  style={{ background: "rgba(251,146,60,0.10)", border: "1px solid rgba(251,146,60,0.30)", color: "#fdba74" }}>
                                  AI Est.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {item.markupNote && (
                          <div
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold mb-2"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5" }}>
                            ⚠ {item.markupNote}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.explanation}</p>
                        {/* Compare links */}
                        <div className="flex flex-wrap gap-1.5">
                          {item.googleLensUrl && (
                            <a href={item.googleLensUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95"
                              style={{ background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc" }}>
                              🔍 Find by Image <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          <a href={item.amazonSearchUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:opacity-80 active:scale-95"
                            style={{ background: "rgba(255,153,0,0.08)", border: "1px solid rgba(255,153,0,0.18)", color: "#ffa726" }}>
                            Amazon <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                          <a href={item.aliexpressSearchUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:opacity-80 active:scale-95"
                            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.14)", color: "#f87171" }}>
                            AliExpress <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-700 mt-2 text-right">
              Links may earn us a small commission at no extra cost to you.
            </p>
          </motion.div>
        )}

        {/* ── AMAZON RECOMMENDATIONS ─────────────────────────────────────── */}
        {(() => {
          const recs = (report as unknown as { amazonRecommendations?: { name: string; estimatedPrice: string; rating: number; reviewCount: string; whyBuy: string; searchUrl: string; asin?: string; productUrl?: string; imageUrl?: string; isPrime?: boolean; isBestSeller?: boolean; source?: "amazon-live" | "ai-estimated" }[] }).amazonRecommendations;
          if (!recs || recs.length === 0) return null;
          return (
            <AmazonRecommendations recommendations={recs} />
          );
        })()}

        {/* ── ALIEXPRESS RECOMMENDATIONS ─────────────────────────────────── */}
        {(() => {
          const recs = (report as unknown as { aliexpressRecommendations?: { productId: string; name: string; price: string; priceNumeric: number; rating: number | null; ordersText: string; imageUrl: string | null; productUrl: string }[] }).aliexpressRecommendations;
          if (!recs || recs.length === 0) return null;
          return (
            <AliExpressRecommendations recommendations={recs} />
          );
        })()}

        {/* ── PROS & CONS ─────────────────────────────────────────────────── */}
        <ProsAndCons pros={report.pros} cons={report.cons} />

        {/* ── RETURN POLICY ───────────────────────────────────────────────── */}
        <ReturnPolicy returnSummary={report.returnSummary} />

        {/* ── WHO SHOULD BUY / AVOID ──────────────────────────────────────── */}
        <WhoShouldBuyAvoid
          whoShouldBuy={report.whoShouldBuy}
          whoShouldAvoid={report.whoShouldAvoid}
          isBasicPlan={isBasicPlan}
        />

        {/* ── FINAL TAKE ──────────────────────────────────────────────────── */}
        <FinalTake finalTake={report.finalTake} />

        {/* ── TECHNICAL ANALYSIS (collapsible) ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.4 }}
          className="mb-6">

          <button
            onClick={() => setShowTech(!showTech)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-600 hover:text-gray-400 transition-all hover:bg-white/[0.015]"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
            <motion.div animate={{ rotate: showTech ? 180 : 0 }} transition={{ duration: 0.22 }}>
              <ChevronDown className="h-4 w-4" />
            </motion.div>
            {showTech ? "Hide" : "View"} full technical analysis
          </button>

          <AnimatePresence initial={false}>
            {showTech && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden">
                <div className="mt-3 space-y-3">

                  {/* All signals grid */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.08)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70 mb-4 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> All Trust Signals
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {report.storeSignals.map((s, i) => {
                        const SIcon  = s.status === "pass" ? CheckCircle2 : s.status === "fail" ? XCircle : AlertCircle;
                        const sc     = s.status === "pass" ? "#4ade80" : s.status === "fail" ? "#f87171" : "#fbbf24";
                        return (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <SIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: sc }} />
                            <div className="min-w-0">
                              <span className="font-medium text-gray-300">{s.name}</span>
                              <span className="text-gray-600"> — {s.detail}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Red flags */}
                  {report.redFlags.length > 0 && (
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.09)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 mb-3 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" /> Red Flags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.redFlags.map((f, i) => (
                          <span key={i}
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.16)", color: "#fca5a5" }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suspicious signals */}
                  {(report.suspiciousSignals ?? []).length > 0 && (
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(234,179,8,0.03)", border: "1px solid rgba(234,179,8,0.09)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80 mb-3">Suspicious Patterns</p>
                      <ul className="space-y-1.5">
                        {report.suspiciousSignals.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500/60" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Community scam reports */}
                  {(report as unknown as { communityReports?: { count: number; snippets: string[] } }).communityReports && (report as unknown as { communityReports: { count: number; snippets: string[] } }).communityReports.count > 0 && (() => {
                    const cr = (report as unknown as { communityReports: { count: number; snippets: string[] } }).communityReports;
                    return (
                      <div
                        className="rounded-2xl p-5"
                        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                            <span className="text-xs">🚨</span>
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80">Community Reports</p>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                            {cr.count} report{cr.count > 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-red-300/70 mb-3">Other users have flagged this store as potentially unsafe</p>
                        <div className="space-y-2">
                          {cr.snippets.map((s, i) => (
                            <div key={i} className="rounded-xl px-3 py-2 text-xs text-gray-400 leading-relaxed"
                              style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(239,68,68,0.1)" }}>
                              &ldquo;{s}{s.length >= 120 ? "..." : ""}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Manipulation tactics */}
                  {(report.manipulationTactics ?? []).length > 0 && (
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.09)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 mb-1">Dark Patterns</p>
                      <p className="text-xs text-gray-600 mb-3">Tactics designed to pressure you into buying</p>
                      <div className="flex flex-wrap gap-2">
                        {report.manipulationTactics.map((t, i) => (
                          <span key={i}
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)", color: "#fca5a5" }}>
                            ⚠ {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review platforms */}
                  {(report.reviewPlatforms ?? []).length > 0 && (
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.08)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-green-400/80 mb-2">Customer Review Platforms</p>
                      <div className="flex flex-wrap gap-2">
                        {report.reviewPlatforms.map((p, i) => (
                          <span key={i}
                            className="rounded-lg px-3 py-1 text-xs font-medium"
                            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.14)", color: "#86efac" }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping origin */}
                  {(report.shippingOriginSignals ?? []).length > 0 && (
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(56,189,248,0.03)", border: "1px solid rgba(56,189,248,0.07)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400/80 mb-3 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5" /> Shipping Origin
                      </p>
                      <ul className="space-y-1">
                        {report.shippingOriginSignals.map((s, i) => (
                          <li key={i} className="text-xs text-gray-500">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Complaints */}
                  {report.complaints.length > 0 && (
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Likely Complaint Themes</p>
                      <ul className="space-y-1.5">
                        {report.complaints.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                            <span className="text-gray-700 shrink-0 mt-0.5">·</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── FACEBOOK AD DEEP CHECK ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.4 }}
          className="mb-8">
          <SectionHeader label="Facebook Ad Check" />
          <FBAdChecker />
        </motion.div>

        {/* ── GROWTH CTA — shown only to non-logged-in visitors ──────────── */}
        {isLoggedIn === false && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.45 }}
            className="mb-8 rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.06)" }}>
            {/* Top accent line */}
            <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6,#6366f1)" }} />
            <div className="px-6 py-7 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-base font-bold text-white mb-1">
                  Want to check stores before you buy?
                </p>
                <p className="text-sm text-gray-400">
                  Join thousands of shoppers who use StorecheckAI to avoid scams and bad stores.
                  AI analysis in under 30 seconds.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <motion.a
                  href="/register"
                  whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  <Shield className="h-4 w-4" />
                  Create free account
                </motion.a>
                <p className="text-[11px] text-gray-600">No credit card required</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CTA / FOOTER ────────────────────────────────────────────────── */}
        <ReportFooter isLoggedIn={isLoggedIn} />

      </main>

      {/* ── MOBILE STICKY VERDICT BAR ───────────────────────────────────── */}
      <MobileStickyVerdictBar
        verdictConfig={vc}
        trustScore={report.trustScore}
        trustColor={trustColor}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
