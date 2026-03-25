"use client";

import { motion } from "framer-motion";
import { AlertTriangle, DollarSign, ShoppingBag, Users } from "lucide-react";

const stats = [
  {
    icon: DollarSign,
    value: "$8B+",
    label: "lost every year",
    sub: "Americans lose over $8 billion annually to counterfeit & low-quality products from online stores.",
    color: "#f87171",
    glow: "rgba(239,68,68,0.15)",
  },
  {
    icon: ShoppingBag,
    value: "1 in 3",
    label: "orders are misrepresented",
    sub: "One in three shoppers receives items that don't match the ad — wrong quality, wrong size, or just junk.",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.12)",
  },
  {
    icon: Users,
    value: "60%",
    label: "of victims don't get refunds",
    sub: "Most scam stores ghost you after payment. No customer support, no return policy — just silence.",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.10)",
  },
  {
    icon: AlertTriangle,
    value: "45%",
    label: "of social-media ads are risky",
    sub: "Nearly half of products promoted via Facebook and Instagram ads come from unverified or suspicious stores.",
    color: "#c084fc",
    glow: "rgba(192,132,252,0.10)",
  },
];

export function ThreatHook() {
  return (
    <section className="relative px-4 py-20 sm:px-6 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(ellipse, rgba(239,68,68,0.08) 0%, transparent 70%)" }} />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          {/* Warning badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            <AlertTriangle className="h-3 w-3" />
            The hidden cost of online shopping
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            Don&apos;t let a sketchy ad cost your family{" "}
            <span style={{ background: "linear-gradient(90deg, #f87171, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              hundreds of dollars
            </span>
          </h2>

          <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Every scroll through your feed is a minefield. Fake reviews, stolen product photos, hidden subscriptions —
            scam stores are getting harder to spot, and the people who fall for them are real families just like yours.
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {stats.map(({ icon: Icon, value, label, sub, color, glow }, i) => (
            <motion.div
              key={value}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-2xl p-6 flex flex-col gap-3 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22` }}
            >
              {/* Glow blob */}
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl"
                style={{ background: glow }} />

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>

              <div className="relative">
                <p className="text-3xl font-extrabold leading-none mb-0.5" style={{ color }}>{value}</p>
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{label}</p>
              </div>

              <p className="relative text-xs text-gray-500 leading-relaxed">{sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="relative rounded-3xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 100%)",
            border: "1px solid rgba(99,102,241,0.22)",
          }}
        >
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 h-48 w-48 rounded-full blur-3xl opacity-40"
            style={{ background: "rgba(99,102,241,0.2)" }} />

          <div className="relative text-center sm:text-left">
            <p className="font-bold text-white text-lg leading-snug">
              Check before you checkout — protect your family&apos;s money.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              One quick scan tells you everything shady stores don&apos;t want you to know.
            </p>
          </div>

          <a href="#analyze"
            className="relative shrink-0 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}>
            Check a store now — it&apos;s free
          </a>
        </motion.div>
      </div>
    </section>
  );
}
