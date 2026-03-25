"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  ShieldCheck, AlertTriangle, XCircle, CheckCircle2,
  RotateCcw, Truck, CreditCard, Star, ExternalLink, ChevronDown,
} from "lucide-react";

/* ── Score Ring ─────────────────────────────────────────────────────── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 22, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="absolute -rotate-90" width="64" height="64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <div className="text-base font-bold leading-none" style={{ color }}>{score}</div>
        <div className="text-[9px] text-gray-600 leading-none mt-0.5">/100</div>
      </div>
    </div>
  );
}

/* ── Fact Pill ──────────────────────────────────────────────────────── */
function FactPill({ text, color, Icon }: { text: string; color: string; Icon: React.ElementType }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{ background: `${color}12`, border: `1px solid ${color}28`, color }}>
      <Icon className="h-3 w-3 shrink-0" />
      {text}
    </div>
  );
}

/* ── Health Bucket ──────────────────────────────────────────────────── */
const bucketStyle = {
  pass: { bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.18)", color: "#4ade80", label: "Looking Good" },
  warn: { bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.18)", color: "#fbbf24", label: "Worth Reviewing" },
  fail: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.18)", color: "#f87171", label: "Concerns" },
};

function HealthBucket({ type, signals }: { type: "pass" | "warn" | "fail"; signals: string[] }) {
  const [open, setOpen] = useState(false);
  const s = bucketStyle[type];
  return (
    <button onClick={() => setOpen(o => !o)} className="text-left w-full rounded-2xl p-3 transition-all"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</span>
        <ChevronDown className="h-3 w-3 shrink-0 transition-transform" style={{ color: s.color, transform: open ? "rotate(180deg)" : "none" }} />
      </div>
      <div className="text-xl font-bold" style={{ color: s.color }}>{signals.length}</div>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="mt-2 space-y-1 overflow-hidden">
            {signals.map(sig => (
              <li key={sig} className="text-[11px] text-gray-400 leading-snug">· {sig}</li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */
export function SampleReport() {
  const verdictColor = "#fbbf24";
  const verdictBg = "rgba(234,179,8,0.08)";
  const verdictBorder = "rgba(234,179,8,0.2)";
  const verdictGlow = "rgba(234,179,8,0.06)";

  const passing = ["HTTPS / SSL enabled", "Contact email found", "Refund policy page exists", "Active social media presence"];
  const warnings = ["No physical address listed", "Domain registered 8 months ago", "Limited product reviews"];
  const failures = ["Review patterns suggest fake engagement", "Return shipping paid by customer"];

  return (
    <section id="sample-report" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-12 text-center">
          <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
            Sample Report
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">
            What you{" "}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)" }}>
              actually get
            </span>
          </h2>
          <p className="mt-4 text-gray-400">Not just a number — a full breakdown.</p>
        </motion.div>

        {/* Report wrapper */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="rounded-3xl p-[1px]"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.25), rgba(6,182,212,0.2))" }}>
          <div className="rounded-3xl overflow-hidden space-y-3 p-4 sm:p-5" style={{ background: "#07070f" }}>

            {/* ── Store Hero ── */}
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="h-16 w-full"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))" }} />
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: "rgba(255,255,255,0.015)" }}>
                <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold text-gray-500"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}>TS</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-100 truncate">TechSound Store</p>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">techsound-shop.com</span>
                  </div>
                </div>
                <div className="hidden sm:block shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-gray-700">Analyzed</p>
                  <p className="text-xs text-gray-600 mt-0.5">Mar 24, 2026</p>
                </div>
              </div>
            </div>

            {/* ── Verdict Banner ── */}
            <div className="rounded-2xl p-4 sm:p-5"
              style={{ background: verdictBg, border: `1px solid ${verdictBorder}`, boxShadow: `0 0 40px ${verdictGlow}` }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-xl p-2.5 shrink-0"
                  style={{ background: `${verdictColor}15`, border: `1px solid ${verdictColor}28` }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: verdictColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold" style={{ color: verdictColor }}>Buy with Caution</h3>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                    Store has basic trust signals but shows suspicious review patterns and a short domain history. Proceed carefully.
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <ScoreRing score={62} color={verdictColor} />
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-700">Trust</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <FactPill text="Medium Return Risk" color="#fb923c" Icon={RotateCcw} />
                <FactPill text="Ships from CN" color="#fbbf24" Icon={Truck} />
                <FactPill text="Card / PayPal" color="#4ade80" Icon={CreditCard} />
                <FactPill text="Trust: Medium" color={verdictColor} Icon={ShieldCheck} />
              </div>
            </div>

            {/* ── Health Snapshot ── */}
            <div className="grid grid-cols-3 gap-2">
              <HealthBucket type="pass" signals={passing} />
              <HealthBucket type="warn" signals={warnings} />
              <HealthBucket type="fail" signals={failures} />
            </div>
            <p className="text-center text-[11px] text-gray-700">Tap each card to expand</p>

            {/* ── Trustpilot ── */}
            <div className="flex items-center justify-between rounded-2xl px-4 py-3"
              style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.12)" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 mb-1.5">Trustpilot</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="h-3.5 w-3.5"
                        style={{ color: s <= 3 ? "#22d3ee" : "rgba(255,255,255,0.1)", fill: s <= 3 ? "#22d3ee" : "transparent" }} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-cyan-400">3.2</span>
                  <span className="text-xs text-gray-600">· 148 reviews</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-cyan-700" />
            </div>

            {/* ── Pros / Cons ── */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> Pros
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  {["Good battery life (6–8h)", "Comfortable fit", "Clear call quality", "Competitive price"].map(p => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />{p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                  <XCircle className="h-4 w-4" /> Cons
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  {["Weak bass response", "Plastic case feels cheap", "Pairing issues on Android", "No noise cancellation"].map(c => (
                    <li key={c} className="flex items-start gap-2">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Red Flags ── */}
            <div className="rounded-2xl p-4"
              style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                <AlertTriangle className="h-4 w-4" /> Red Flags
              </div>
              <div className="flex flex-wrap gap-2">
                {["Repeated generic praise", "Multiple reviews same day", "Vague return wording", "New domain (< 1 year)"].map(f => (
                  <span key={f} className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Final Take ── */}
            <div className="rounded-2xl px-5 py-4"
              style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <p className="text-sm font-semibold text-gray-200 mb-1">Should you buy it?</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Product has decent real-use feedback, but the store is new with weak trust signals.{" "}
                <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
                  Consider buying from a more established retailer.
                </span>
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
