"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, AlertCircle,
  ArrowLeft, Share2, ExternalLink, Star, ChevronDown,
  RotateCcw, CreditCard, Truck, Users, UserX, ShieldCheck, Tag, Shield,
} from "lucide-react";
import type { Report, RiskLevel, Verdict, StoreSignal, PriceVerdict } from "@/lib/types";
import FBAdChecker from "@/components/FBAdChecker";

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

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex h-[68px] w-[68px] items-center justify-center shrink-0">
      <svg className="absolute -rotate-90" width="68" height="68" aria-hidden="true">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle
          cx="34" cy="34" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" opacity="0.85"
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-lg font-bold leading-none" style={{ color }}>{score}</div>
        <div className="text-[9px] text-gray-700 mt-0.5">/100</div>
      </div>
    </div>
  );
}

// ─── Signal labels ────────────────────────────────────────────────────────────
const SIGNAL_LABELS: Record<string, string> = {
  "HTTPS Secure": "Secure website connection",
  "Security Headers": "Advanced security protection",
  "Return Policy": "Has a return/refund policy",
  "Privacy Policy": "Has a privacy policy",
  "Terms of Service": "Has terms of service",
  "Contact Page": "Has a dedicated contact page",
  "Shipping Policy": "Has a shipping policy",
  "Business Email": "Uses a professional email address",
  "Contact Email": "Has a contact email",
  "Phone Number": "Phone number listed",
  "Physical Address": "Physical address listed",
  "About Page": "Has an About Us page",
  "Payment Methods": "Accepts trusted payment options",
  "Domain Age": "Store age & history",
  "Social Presence": "Active on social media",
  "Trustpilot": "Trustpilot reputation",
  "Business Registration": "Registered business entity",
  "Customer Reviews": "Customer review system",
  "Cookie Consent": "Data privacy compliance",
  "Dark Patterns": "Uses pressure sales tactics",
  "Domain Redirect": "Website redirect detected",
};

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

function priceVerdictConfig(v: PriceVerdict) {
  if (v === "cheap")      return { label: "Good Deal",   color: "#4ade80", bg: "rgba(34,197,94,0.12)"  };
  if (v === "fair")       return { label: "Fair Price",  color: "#38bdf8", bg: "rgba(56,189,248,0.12)" };
  if (v === "overpriced") return { label: "Overpriced",  color: "#fbbf24", bg: "rgba(234,179,8,0.12)"  };
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

// ─── FactPill ─────────────────────────────────────────────────────────────────
function FactPill({ text, color, Icon }: { text: string; color: string; Icon: React.ElementType }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap"
      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {text}
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ label, badge }: { label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 shrink-0">{label}</span>
      {badge && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-600 shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {badge}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

// ─── HealthBucket ─────────────────────────────────────────────────────────────
function HealthBucket({
  type, label, count, signals,
}: {
  type: "pass" | "warn" | "fail";
  label: string;
  count: number;
  signals: StoreSignal[];
}) {
  const [open, setOpen] = useState(false);
  const color  = type === "pass" ? "#4ade80" : type === "fail" ? "#f87171" : "#fbbf24";
  const Icon   = type === "pass" ? CheckCircle2 : type === "fail" ? XCircle : AlertCircle;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-colors"
      style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
      <button
        className="w-full flex items-center justify-between gap-2 p-4 transition-colors hover:bg-white/[0.025]"
        onClick={() => count > 0 && setOpen(!open)}>
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0" style={{ color }} />
          <span className="text-xs font-semibold truncate" style={{ color }}>{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ background: `${color}20`, color }}>
            {count}
          </span>
          {count > 0 && (
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
            </motion.div>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden">
            <ul className="px-4 pb-4 pt-2 space-y-2.5 border-t" style={{ borderColor: `${color}14` }}>
              {signals.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.035, duration: 0.2 }}
                  className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                  <Icon className="mt-0.5 h-3 w-3 shrink-0" style={{ color }} />
                  <span>{s.detail || SIGNAL_LABELS[s.name] || s.name}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
        <XCircle className="h-10 w-10 text-red-400" />
      </div>
      <div>
        <p className="text-xl font-bold mb-2">Report not found</p>
        <p className="text-gray-500 text-sm mb-6 max-w-sm leading-relaxed">{message}</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          <Shield className="h-4 w-4" />
          Check a store
        </a>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const [report,   setReport]   = useState<Report | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [showTech, setShowTech] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/report/${id}`)
      .then(r => r.json())
      .then(data => { if (data.error) setError(data.error); else setReport(data as Report); })
      .catch(() => setError("Failed to load report."));
  }, [id]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error)   return <ErrorState message={error} />;
  if (!report) return <LoadingState />;

  // Groupings
  const passing  = report.storeSignals.filter(s => s.status === "pass");
  const warnings = report.storeSignals.filter(s => s.status === "warn" || s.status === "unknown");
  const failures = report.storeSignals.filter(s => s.status === "fail");

  const vc           = getVerdictConfig(report.verdict);
  const VIcon        = vc.Icon;
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
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5"
        style={{
          background: "rgba(7,7,15,0.92)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}>
        <a
          href="/"
          className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200 transition-colors">
          <motion.div whileHover={{ x: -3 }} transition={{ duration: 0.15 }}>
            <ArrowLeft className="h-4 w-4" />
          </motion.div>
          Check another store
        </a>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all"
            style={{
              borderColor: copied ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)",
              color: copied ? "#4ade80" : "#9ca3af",
              background: "rgba(255,255,255,0.02)",
            }}>
            <Share2 className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Share"}
          </motion.button>
          <a
            href="/"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <Shield className="h-3.5 w-3.5" />
            StorecheckAI
          </a>
        </div>
      </motion.nav>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* ── STORE HERO ──────────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="mb-4 overflow-hidden rounded-3xl"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>

          {report.ogImage ? (
            <div className="relative h-36 sm:h-44 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.ogImage} alt={report.storeName}
                className="h-full w-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(7,7,15,0.97) 0%, rgba(7,7,15,0.1) 100%)" }} />
            </div>
          ) : (
            <div
              className="h-20 w-full"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))" }} />
          )}

          <div className="flex items-center gap-3.5 px-5 py-4" style={{ background: "rgba(255,255,255,0.015)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${report.domain}&sz=64`}
              alt="" width={36} height={36}
              className="rounded-xl shrink-0"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold truncate text-gray-100">{report.storeName}</h1>
              <a
                href={report.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors mt-0.5 group">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate group-hover:underline underline-offset-2">{report.domain}</span>
              </a>
            </div>
            <div className="hidden sm:block shrink-0 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-700">Analyzed</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {new Date(report.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── VERDICT BANNER ──────────────────────────────────────────────── */}
        <motion.div
          {...fadeUpDelayed(0.07)}
          className="mb-4 rounded-3xl p-5 sm:p-6"
          style={{
            background: vc.bg,
            border: `1px solid ${vc.border}`,
            boxShadow: `0 0 48px ${vc.glow}`,
          }}>

          {/* Top row: icon + verdict text + score ring */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="rounded-2xl p-3 shrink-0"
              style={{ background: `${vc.color}15`, border: `1px solid ${vc.color}28` }}>
              <VIcon className="h-6 w-6" style={{ color: vc.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold leading-tight" style={{ color: vc.color }}>
                {vc.label}
              </h2>
              <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">{report.verdictReason}</p>
            </div>
            {/* Trust score ring — visible at a glance */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <ScoreRing score={report.trustScore} color={trustColor} />
              <p className="text-[10px] font-medium text-gray-700 uppercase tracking-wider">Trust</p>
            </div>
          </div>

          {/* Fact pills */}
          <div className="flex flex-wrap gap-2">
            <FactPill text={returnPill.text}  color={returnPill.color}  Icon={RotateCcw}  />
            <FactPill text={shippingPill.text} color={shippingPill.color} Icon={Truck}     />
            <FactPill text={paymentText}       color={paymentColor}       Icon={CreditCard} />
            <FactPill
              text={`Trust: ${scoreLabel(report.trustScore)}`}
              color={trustColor}
              Icon={ShieldCheck} />
          </div>
        </motion.div>

        {/* ── HEALTH SNAPSHOT ─────────────────────────────────────────────── */}
        <motion.div {...fadeUpDelayed(0.13)} className="mb-5">
          <div className="grid grid-cols-3 gap-2.5 mb-2">
            <HealthBucket type="pass" label="Looking Good"    count={passing.length}  signals={passing}  />
            <HealthBucket type="warn" label="Worth Reviewing" count={warnings.length} signals={warnings} />
            <HealthBucket type="fail" label="Concerns"        count={failures.length} signals={failures} />
          </div>
          <p className="text-center text-[11px] text-gray-700">Tap each card to expand</p>
        </motion.div>

        {/* ── TRUSTPILOT ──────────────────────────────────────────────────── */}
        {report.trustpilotRating != null && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4 }}
            className="mb-4 rounded-2xl overflow-hidden"
            style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.12)" }}>
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 mb-2">Trustpilot</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="h-4 w-4"
                        style={{
                          color: s <= Math.round(report.trustpilotRating!) ? "#22d3ee" : "rgba(255,255,255,0.1)",
                          fill:  s <= Math.round(report.trustpilotRating!) ? "#22d3ee" : "transparent",
                        }} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-cyan-400">{report.trustpilotRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-600">· {(report.trustpilotReviewCount ?? 0).toLocaleString()} reviews</span>
                </div>
              </div>
              <a
                href={`https://www.trustpilot.com/review/${report.domain}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-400 transition-colors">
                View all <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {/* Review snippets */}
            {(report.trustpilotReviews ?? []).length > 0 && (
              <div className="border-t px-5 pb-4 pt-3 space-y-2.5" style={{ borderColor: "rgba(34,211,238,0.1)" }}>
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">What customers say</p>
                {(report.trustpilotReviews ?? []).slice(0, 4).map((rev, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-0.5 text-cyan-600 shrink-0">›</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{rev}</p>
                  </div>
                ))}
                {/* AI verdict on reviews */}
                {(() => {
                  const r = report.trustpilotRating!;
                  const verdict =
                    r >= 4.2
                      ? { icon: "✅", color: "#4ade80", bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.18)",
                          text: `Customers are largely satisfied — a ${r.toFixed(1)}/5 rating suggests this store delivers on its promises. Generally safe to purchase.` }
                      : r >= 3.0
                      ? { icon: "⚠️", color: "#fbbf24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.18)",
                          text: `Mixed feedback — a ${r.toFixed(1)}/5 rating means experiences vary. Read recent reviews carefully before ordering and consider using a protected payment method.` }
                      : { icon: "🚫", color: "#f87171", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.18)",
                          text: `Mostly negative reviews — a ${r.toFixed(1)}/5 rating is a red flag. Customers report serious issues. We recommend avoiding this store or buying with caution.` };
                  return (
                    <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mt-1"
                      style={{ background: verdict.bg, border: `1px solid ${verdict.border}` }}>
                      <span className="text-sm shrink-0 mt-px">{verdict.icon}</span>
                      <p className="text-xs leading-relaxed" style={{ color: verdict.color }}>{verdict.text}</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}

        {/* ── PRICE CHECK ─────────────────────────────────────────────────── */}
        {(report.priceAnalysis ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4 }}
            className="mb-5">
            <SectionHeader label="Price Check" badge="GPT-4o Vision" />

            <div className="space-y-3">
              {(report.priceAnalysis ?? []).map((item, i) => {
                const pvc     = priceVerdictConfig(item.priceVerdict);
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
                          <p className="text-sm font-semibold text-gray-200 leading-tight">{item.identifiedAs}</p>
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
                            <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Amazon</span>
                            <span className="text-sm font-semibold" style={{ color: pvc.color }}>{item.estimatedMarketPrice}</span>
                          </div>
                          {item.aliexpressPrice && (
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">AliExpress</span>
                              <span className="text-sm font-semibold text-gray-500">{item.aliexpressPrice}</span>
                            </div>
                          )}
                          {item.temuPrice && (
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Temu</span>
                              <span className="text-sm font-semibold text-gray-500">{item.temuPrice}</span>
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
                          {item.temuSearchUrl && (
                            <a href={item.temuSearchUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:opacity-80 active:scale-95"
                              style={{ background: "rgba(255,90,0,0.07)", border: "1px solid rgba(255,90,0,0.16)", color: "#fb923c" }}>
                              Temu <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── PROS & CONS ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.4 }}
          className="mb-4">
          <SectionHeader label="Assessment" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
              <p className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> What this store does well
              </p>
              {report.pros.length > 0 ? (
                <ul className="space-y-2">
                  {report.pros.slice(0, 4).map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500/60" />
                      {p}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-600">No notable positives identified.</p>}
            </div>
            <div
              className="rounded-2xl p-5"
              style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
              <p className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Watch out for
              </p>
              {report.cons.length > 0 ? (
                <ul className="space-y-2">
                  {report.cons.slice(0, 4).map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/60" />
                      {c}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-600">No notable negatives identified.</p>}
            </div>
          </div>
        </motion.div>

        {/* ── RETURN POLICY ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.4 }}
          className="mb-4 rounded-2xl p-5"
          style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.1)" }}>
          <p className="text-xs font-semibold text-orange-400 mb-2.5 flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Return & Refund Policy
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{report.returnSummary}</p>
        </motion.div>

        {/* ── WHO SHOULD BUY / AVOID ──────────────────────────────────────── */}
        {(report.whoShouldBuy || report.whoShouldAvoid) && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4 }}
            className="mb-4">
            <SectionHeader label="Who Is This For?" />
            <div className="grid gap-3 sm:grid-cols-2">
              {report.whoShouldBuy && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.08)" }}>
                  <p className="text-xs font-semibold text-green-400 mb-2.5 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Good fit for
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">{report.whoShouldBuy}</p>
                </div>
              )}
              {report.whoShouldAvoid && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}>
                  <p className="text-xs font-semibold text-red-400 mb-2.5 flex items-center gap-1.5">
                    <UserX className="h-3.5 w-3.5" /> Think twice if you…
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">{report.whoShouldAvoid}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FINAL TAKE ──────────────────────────────────────────────────── */}
        {report.finalTake && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.4 }}
            className="mb-4 rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.04))",
              border: "1px solid rgba(99,102,241,0.15)",
            }}>
            <p className="text-[10px] font-bold tracking-widest text-indigo-400/80 mb-2.5 uppercase">
              Our Bottom Line
            </p>
            <p className="text-sm text-gray-200 leading-relaxed">{report.finalTake}</p>
          </motion.div>
        )}

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

        {/* ── CTA / FOOTER ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3 text-center py-8 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <motion.a
            href="/"
            whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <Shield className="h-4 w-4" />
            Check another store
          </motion.a>
          <p className="text-[11px] text-gray-700">
            StorecheckAI · Analysis for informational purposes only
          </p>
        </motion.div>

      </main>
    </div>
  );
}
