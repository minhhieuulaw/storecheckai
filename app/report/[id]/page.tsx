"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle,
  Shield,
} from "lucide-react";
import type { Report, RiskLevel, Verdict, StoreSignal } from "@/lib/types";
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
import { TechnicalAnalysisCollapsible } from "@/components/report/advanced/TechnicalAnalysisCollapsible";
import { FacebookAdDeepCheck } from "@/components/report/advanced/FacebookAdDeepCheck";
import { DropshipRiskCard } from "@/components/report/commerce/DropshipRiskCard";
import { LandedCostCard } from "@/components/report/commerce/LandedCostCard";
import { ProductIntelCard } from "@/components/report/commerce/ProductIntelCard";
import { PriceCheck } from "@/components/report/commerce/PriceCheck";
import { AmazonRecommendations } from "@/components/report/commerce/AmazonRecommendations";
import { AliExpressRecommendations } from "@/components/report/commerce/AliExpressRecommendations";

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


// ─── SectionHeader ────────────────────────────────────────────────────────────
// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const [report,      setReport]      = useState<Report | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);
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
        <PriceCheck
          priceAnalysis={report.priceAnalysis ?? []}
          products={report.products ?? []}
          isBasicPlan={isBasicPlan}
        />

        {/* ── AMAZON RECOMMENDATIONS ─────────────────────────────────────── */}
        {(() => {
          const recs = (report as unknown as { amazonRecommendations?: { name: string; estimatedPrice: string; rating: number; reviewCount: string; whyBuy: string; searchUrl: string; asin?: string; productUrl?: string; imageUrl?: string; isPrime?: boolean; isBestSeller?: boolean; source?: "amazon-live" | "ai-estimated" }[] }).amazonRecommendations;
          if (!recs || recs.length === 0) return null;
          return <AmazonRecommendations recommendations={recs} />;
        })()}

        {/* ── ALIEXPRESS RECOMMENDATIONS ─────────────────────────────────── */}
        {(() => {
          const recs = (report as unknown as { aliexpressRecommendations?: { productId: string; name: string; price: string; priceNumeric: number; rating: number | null; ordersText: string; imageUrl: string | null; productUrl: string }[] }).aliexpressRecommendations;
          if (!recs || recs.length === 0) return null;
          return <AliExpressRecommendations recommendations={recs} />;
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
        <TechnicalAnalysisCollapsible report={report} />

        {/* ── FACEBOOK AD DEEP CHECK ──────────────────────────────────────── */}
        <FacebookAdDeepCheck />

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
