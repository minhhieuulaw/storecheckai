"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, AlertCircle,
  RotateCcw, CreditCard, Truck, ShieldCheck,
  ExternalLink, ChevronDown, Star, Users, UserX, Tag,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ─── Static sample data ──────────────────────────────────────────────────────
const SAMPLE = {
  storeName:   "TechSound Store",
  domain:      "techsound-shop.com",
  analyzedAt:  "Mar 24, 2026",
  trustScore:  62,
  verdict:     "CAUTION" as const,
  verdictReason: "The store has basic security in place and accepts reputable payment methods, but several trust signals are missing — no physical address, a recently registered domain, and limited social presence raise concerns worth reviewing before purchasing.",
  returnRisk:  "MEDIUM" as const,
  shipping:    "Ships Overseas",
  payment:     "Card / PayPal",
  passing:  ["Valid HTTPS certificate", "Accepts PayPal & major cards", "Has a return policy page", "Privacy policy found"],
  warnings: ["Domain registered 8 months ago", "No physical address listed", "Ships from China (14–30 days)"],
  failures: ["No customer reviews on-site", "Missing business registration info"],
  tpRating: 3.2,
  tpCount:  148,
  tpReviews: [
    "Ordered 3 weeks ago and still waiting. Support never replied to my emails.",
    "Product looks completely different from the photos. Cheap plastic, not what I expected.",
    "Shipping took forever but the item eventually arrived. Quality is okay for the price.",
    "Amazing Customer Service, helped me with my refund immediately!",
  ],
  pros: [
    "HTTPS encryption active — your payment data is protected",
    "Accepts PayPal and major credit cards",
    "Return policy page exists",
  ],
  cons: [
    "Recently registered domain — limited track record",
    "Products ship from China, expect 2–4 week delivery",
    "No verifiable business address or registration",
  ],
  returnSummary: "The store offers a 30-day return window but requires customers to cover return shipping costs. Refund processing takes 7–14 business days. The policy contains vague language around 'change of mind' returns — read carefully before ordering.",
  whoShouldBuy:   "Shoppers who've researched the product elsewhere and are comfortable with international shipping times.",
  whoShouldAvoid: "Anyone needing fast delivery or who wants hassle-free returns with guaranteed buyer protection.",
  finalTake:  "TechSound Store isn't a clear scam, but it has too many unanswered questions to shop here without caution. Verify the product photos against other sources, pay via PayPal for buyer protection, and be prepared for a long shipping wait.",
  redFlags:   ["No customer reviews on-site", "Domain registered < 1 year ago"],
  suspicious: ["Countdown timer on product page (pressure tactic)", "Stock scarcity messaging without real inventory data"],
  signals: [
    { name: "HTTPS",           status: "pass", detail: "Valid SSL certificate — traffic is encrypted" },
    { name: "Domain Age",      status: "warn", detail: "Registered ~8 months ago" },
    { name: "Return Policy",   status: "pass", detail: "Return policy page exists" },
    { name: "Privacy Policy",  status: "pass", detail: "Privacy policy found" },
    { name: "Payment Methods", status: "pass", detail: "Accepts PayPal, Visa, Mastercard" },
    { name: "Physical Address",status: "fail", detail: "No physical address listed" },
    { name: "Social Presence", status: "warn", detail: "Facebook page found but low engagement" },
    { name: "Business Email",  status: "warn", detail: "Contact email uses free provider" },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 65) return "#4ade80";
  if (s >= 40) return "#fbbf24";
  return "#f87171";
}

// ─── ScoreRing ───────────────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 22, circ = 2 * Math.PI * r;
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="absolute -rotate-90" width="64" height="64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <div className="text-base font-bold leading-none" style={{ color }}>{score}</div>
        <div className="text-[9px] text-gray-600 leading-none mt-0.5">/100</div>
      </div>
    </div>
  );
}

// ─── FactPill ────────────────────────────────────────────────────────────────
function FactPill({ text, color, Icon }: { text: string; color: string; Icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap"
      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {text}
    </div>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
function SectionHeader({ label, badge }: { label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 shrink-0">{label}</span>
      {badge && (
        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-600 shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {badge}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

// ─── HealthBucket ────────────────────────────────────────────────────────────
function HealthBucket({ type, label, signals }: {
  type: "pass" | "warn" | "fail";
  label: string;
  signals: string[];
}) {
  const [open, setOpen] = useState(false);
  const color = type === "pass" ? "#4ade80" : type === "fail" ? "#f87171" : "#fbbf24";
  const Icon  = type === "pass" ? CheckCircle2 : type === "fail" ? XCircle : AlertCircle;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
      <button
        className="w-full flex items-center justify-between gap-2 p-4 transition-colors hover:bg-white/[0.025]"
        onClick={() => signals.length > 0 && setOpen(!open)}>
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0" style={{ color }} />
          <span className="text-xs font-semibold truncate" style={{ color }}>{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ background: `${color}20`, color }}>{signals.length}</span>
          {signals.length > 0 && (
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
            </motion.div>
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden">
            <ul className="px-4 pb-4 pt-2 space-y-2.5 border-t" style={{ borderColor: `${color}14` }}>
              {signals.map((s, i) => (
                <motion.li key={i}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                  <Icon className="mt-0.5 h-3 w-3 shrink-0" style={{ color }} />
                  <span>{s}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function SampleReport() {
  const { t } = useTranslation();
  const sr = t.sampleReport;
  const [showTech, setShowTech] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me").then(r => { if (r.ok) setIsLoggedIn(true); }).catch(() => {});
  }, []);

  const trustColor  = scoreColor(SAMPLE.trustScore);
  const verdictColor = "#fbbf24";
  const verdictBg    = "rgba(234,179,8,0.07)";
  const verdictBorder = "rgba(234,179,8,0.18)";
  const verdictGlow  = "rgba(234,179,8,0.08)";

  // Trustpilot verdict
  const starColor = SAMPLE.tpRating >= 4 ? "#00b67a" : SAMPLE.tpRating >= 3 ? "#fbbf24" : SAMPLE.tpRating >= 2 ? "#f97316" : "#ef4444";
  const tpVColor  = "#f87171";
  const tpVBg     = "rgba(239,68,68,0.07)";
  const tpVBorder = "rgba(239,68,68,0.2)";

  return (
    <section id="sample-report" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-12 text-center">
          <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
            {sr.badge}
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">
            {sr.heading}{" "}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)" }}>
              {sr.headingAccent}
            </span>
          </h2>
          <p className="mt-4 text-gray-400">{sr.subtitle}</p>
        </motion.div>

        {/* Report wrapper */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="rounded-3xl p-[1px]"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.25), rgba(6,182,212,0.2))" }}>
          <div className="rounded-3xl overflow-hidden space-y-3 p-4 sm:p-5" style={{ background: "#07070f" }}>

            {/* ── Store Hero ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Accent line */}
              <div className="h-px w-full"
                style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5) 40%, rgba(139,92,246,0.5) 60%, transparent)" }} />

              <div className="flex items-center gap-4 px-5 py-5">
                {/* Logo with glow */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-2 rounded-2xl blur-lg opacity-25"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
                  <div className="relative h-14 w-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
                    <span className="text-lg font-extrabold" style={{ color: "#a5b4fc" }}>TS</span>
                  </div>
                </div>

                {/* Store info */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white leading-tight truncate">{SAMPLE.storeName}</h3>
                  <div className="inline-flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span>{SAMPLE.domain}</span>
                  </div>
                </div>

                {/* Analyzed badge */}
                <div className="shrink-0">
                  <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                    <span className="text-[11px] font-medium text-indigo-300">{SAMPLE.analyzedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Verdict Banner ── */}
            <div className="rounded-3xl p-5 sm:p-6"
              style={{ background: verdictBg, border: `1px solid ${verdictBorder}`, boxShadow: `0 0 48px ${verdictGlow}` }}>
              <div className="flex items-start gap-4 mb-5">
                <div className="rounded-2xl p-3 shrink-0"
                  style={{ background: `${verdictColor}15`, border: `1px solid ${verdictColor}28` }}>
                  <AlertTriangle className="h-6 w-6" style={{ color: verdictColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold leading-tight" style={{ color: verdictColor }}>Use Caution</h3>
                  <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">{SAMPLE.verdictReason}</p>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <ScoreRing score={SAMPLE.trustScore} color={trustColor} />
                  <p className="text-[10px] font-medium text-gray-700 uppercase tracking-wider">Trust</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <FactPill text="Returns Available" color="#fbbf24"  Icon={RotateCcw}  />
                <FactPill text="Ships Overseas"    color="#fbbf24"  Icon={Truck}      />
                <FactPill text="Card / PayPal"     color="#4ade80"  Icon={CreditCard} />
                <FactPill text="Trust: Medium"     color={trustColor} Icon={ShieldCheck} />
              </div>
            </div>

            {/* ── Health Snapshot ── */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-2">
                <HealthBucket type="pass" label="Looking Good"    signals={SAMPLE.passing}  />
                <HealthBucket type="warn" label="Worth Reviewing" signals={SAMPLE.warnings} />
                <HealthBucket type="fail" label="Concerns"        signals={SAMPLE.failures} />
              </div>
              <p className="text-center text-[11px] text-gray-700">Tap each card to expand</p>
            </div>

            {/* ── Trustpilot ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {/* Header */}
              <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mb-3"
                    style={{ background: "rgba(0,182,122,0.12)", border: "1px solid rgba(0,182,122,0.2)" }}>
                    <Star className="h-3 w-3" style={{ color: "#00b67a", fill: "#00b67a" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00b67a" }}>Trustpilot</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-white leading-none">{SAMPLE.tpRating.toFixed(1)}</span>
                    <div className="pb-0.5">
                      <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map(s => {
                          const filled = s <= Math.round(SAMPLE.tpRating);
                          return (
                            <Star key={s} className="h-3.5 w-3.5"
                              style={{ color: filled ? starColor : "rgba(255,255,255,0.12)", fill: filled ? starColor : "transparent" }} />
                          );
                        })}
                      </div>
                      <span className="text-[11px] text-gray-500">{SAMPLE.tpCount.toLocaleString()} reviews</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs text-gray-600 mt-1">
                  View all <ExternalLink className="h-3 w-3" />
                </div>
              </div>

              {/* Reviews + verdict */}
              <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-3">What customers say</p>
                <div className="space-y-2 mb-4">
                  {SAMPLE.tpReviews.map((rev, i) => (
                    <div key={i} className="rounded-xl px-3.5 py-2.5"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs text-gray-400 leading-relaxed">&ldquo;{rev}&rdquo;</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tpVBorder}` }}>
                  <div className="px-3.5 py-2 flex items-center gap-2" style={{ background: tpVBg }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tpVColor }}>High Risk</span>
                  </div>
                  <div className="px-3.5 py-3" style={{ background: "rgba(255,255,255,0.015)" }}>
                    <p className="text-xs font-medium leading-relaxed mb-1.5" style={{ color: tpVColor }}>
                      Reviewers frequently complain about: slow or missing deliveries, poor product quality, unresponsive customer support.
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Think twice before purchasing here — explore alternative stores first. If you proceed, use PayPal or a credit card so you can dispute charges if needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Assessment (Pros / Cons) ── */}
            <div>
              <SectionHeader label="Assessment" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl p-5"
                  style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
                  <p className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> What this store does well
                  </p>
                  <ul className="space-y-2">
                    {SAMPLE.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500/60" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl p-5"
                  style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <p className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" /> Watch out for
                  </p>
                  <ul className="space-y-2">
                    {SAMPLE.cons.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/60" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ── Return Policy ── */}
            <div className="rounded-2xl p-5"
              style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.1)" }}>
              <p className="text-xs font-semibold text-orange-400 mb-2.5 flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Return &amp; Refund Policy
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{SAMPLE.returnSummary}</p>
            </div>

            {/* ── Who Is This For ── */}
            <div>
              <SectionHeader label="Who Is This For?" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl p-5"
                  style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.08)" }}>
                  <p className="text-xs font-semibold text-green-400 mb-2.5 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Good fit for
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">{SAMPLE.whoShouldBuy}</p>
                </div>
                <div className="rounded-2xl p-5"
                  style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}>
                  <p className="text-xs font-semibold text-red-400 mb-2.5 flex items-center gap-1.5">
                    <UserX className="h-3.5 w-3.5" /> Think twice if you…
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">{SAMPLE.whoShouldAvoid}</p>
                </div>
              </div>
            </div>

            {/* ── Our Bottom Line ── */}
            <div className="rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.15)" }}>
              <p className="text-[10px] font-bold tracking-widest text-indigo-400/80 mb-2.5 uppercase">Our Bottom Line</p>
              <p className="text-sm text-gray-200 leading-relaxed">{SAMPLE.finalTake}</p>
            </div>

            {/* ── Technical Analysis (collapsible) ── */}
            <div>
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
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden">
                    <div className="mt-3 space-y-3">

                      {/* All signals */}
                      <div className="rounded-2xl p-5"
                        style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.08)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70 mb-4 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" /> All Trust Signals
                        </p>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {SAMPLE.signals.map((s, i) => {
                            const SIcon = s.status === "pass" ? CheckCircle2 : s.status === "fail" ? XCircle : AlertCircle;
                            const sc    = s.status === "pass" ? "#4ade80" : s.status === "fail" ? "#f87171" : "#fbbf24";
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
                      <div className="rounded-2xl p-5"
                        style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.09)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/80 mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> Red Flags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SAMPLE.redFlags.map((f, i) => (
                            <span key={i} className="rounded-full px-3 py-1 text-xs font-medium"
                              style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.16)", color: "#fca5a5" }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Suspicious patterns */}
                      <div className="rounded-2xl p-5"
                        style={{ background: "rgba(234,179,8,0.03)", border: "1px solid rgba(234,179,8,0.09)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80 mb-3 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" /> Suspicious Patterns
                        </p>
                        <ul className="space-y-1.5">
                          {SAMPLE.suspicious.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500/60" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── CTA Block ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 100%)",
                border: "1px solid rgba(99,102,241,0.22)",
              }}
            >
              <div className="text-center sm:text-left">
                <p className="font-semibold text-white text-sm leading-snug">
                  Want a report like this for any store you&apos;re about to buy from?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Takes under 30 seconds. No credit card required to start.
                </p>
              </div>
              <a
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
              >
                {isLoggedIn ? "Check a store now" : "Start for free"}
              </a>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
