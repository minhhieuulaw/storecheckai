"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, RotateCcw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="absolute -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="text-xl font-bold text-yellow-400">{score}</div>
        <div className="text-[9px] text-gray-500 leading-none">/100</div>
      </div>
    </div>
  );
}

export function SampleReport() {
  return (
    <section id="sample-report" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{
              background: "rgba(99,102,241,0.12)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          >
            Sample Report
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">
            What you{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)" }}
            >
              actually get
            </span>
          </h2>
          <p className="mt-4 text-gray-400">Not just a number — a full breakdown.</p>
        </motion.div>

        {/* Report card with gradient border */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-[1px]"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.3), rgba(6,182,212,0.3))",
          }}
        >
          <div
            className="rounded-3xl overflow-hidden"
            style={{ background: "#0d0d1a" }}
          >
            {/* Header */}
            <div
              className="px-8 py-6"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-mono">shopexample.com · Wireless Earbuds Pro X</p>
                  <h3 className="text-xl font-bold">TechSound Wireless Earbuds</h3>
                </div>
                {/* Verdict */}
                <div
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2.5"
                  style={{
                    background: "rgba(234,179,8,0.12)",
                    border: "1px solid rgba(234,179,8,0.3)",
                  }}
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="font-bold text-yellow-400 text-sm">Buy with Caution</span>
                </div>
              </div>

              {/* Score row */}
              <div className="mt-6 flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-4">
                  <ScoreRing score={72} />
                  <div>
                    <div className="text-sm font-semibold text-gray-200">Trust Score</div>
                    <div className="text-xs text-gray-500">Medium trust</div>
                  </div>
                </div>

                <div
                  className="h-12 w-px hidden sm:block"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />

                <div>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold mb-1"
                    style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)", color: "#fbbf24" }}
                  >
                    ⚠ Medium Risk
                  </div>
                  <div className="text-xs text-gray-500">Return Risk</div>
                </div>

                <div
                  className="h-12 w-px hidden sm:block"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />

                <div>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold mb-1"
                    style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }}
                  >
                    ◎ Moderate
                  </div>
                  <div className="text-xs text-gray-500">Review Confidence</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="grid gap-6 p-8 md:grid-cols-2">
              {/* Pros */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}
              >
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Pros
                </div>
                <ul className="space-y-2.5 text-sm text-gray-300">
                  {["Good battery life (6–8h)", "Comfortable fit, multiple ear tips", "Clear call quality", "Competitive price point"].map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}
              >
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-400">
                  <XCircle className="h-4 w-4" />
                  Cons
                </div>
                <ul className="space-y-2.5 text-sm text-gray-300">
                  {["Weak bass response", "Plastic case feels cheap", "Pairing issues on Android", "No active noise cancellation"].map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Store signals */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)" }}
              >
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: "#818cf8" }}>
                  <ShieldCheck className="h-4 w-4" />
                  Store Signals
                </div>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />HTTPS enabled</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Contact email found</li>
                  <li className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-yellow-500" />No physical address listed</li>
                  <li className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-yellow-500" />Domain registered 8 months ago</li>
                </ul>
              </div>

              {/* Return policy */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.12)" }}
              >
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-orange-400">
                  <RotateCcw className="h-4 w-4" />
                  Return Policy
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  30-day return window stated, but{" "}
                  <span className="text-yellow-400 font-medium">customer pays return shipping</span>{" "}
                  and refund processing terms are vague. No mention of restocking fees.
                </p>
              </div>

              {/* Red flags — full width */}
              <div
                className="md:col-span-2 rounded-2xl p-5"
                style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}
              >
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  Red Flags
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Repeated generic praise", "Multiple reviews same day", "Vague return wording", "New domain (< 1 year)"].map((f) => (
                    <span
                      key={f}
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#fca5a5",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer verdict */}
            <div
              className="px-8 py-5"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(99,102,241,0.05)",
              }}
            >
              <p className="text-sm font-semibold text-gray-200 mb-1">Should you buy it?</p>
              <p className="text-sm text-gray-400">
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
