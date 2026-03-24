"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Star, RotateCcw, TrendingUp } from "lucide-react";

const glassCard = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(10px)",
};

export function Benefits() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: "rgba(99,102,241,0.12)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          >
            Why StorecheckAI
          </span>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* Card 1 — large, spans 2 rows */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl p-8 md:row-span-2 flex flex-col justify-between min-h-[320px]"
            style={glassCard}
          >
            {/* Glow accent */}
            <div
              className="absolute -top-12 -left-12 h-48 w-48 rounded-full blur-3xl"
              style={{ background: "rgba(99,102,241,0.2)" }}
            />
            <div
              className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <ShieldCheck className="h-7 w-7" style={{ color: "#818cf8" }} />
            </div>
            <div className="relative">
              <h3 className="mb-3 text-2xl font-bold">Avoid Scammy Stores</h3>
              <p className="text-gray-400 leading-relaxed">
                We check HTTPS, domain age, contact info, policy pages, and
                social links — so you know if the store is legit before you
                spend a single cent.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {["HTTPS check", "Domain age", "Policy pages", "Social links"].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl px-3 py-2 text-xs text-gray-400"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl p-7 flex flex-col justify-between min-h-[200px]"
            style={glassCard}
          >
            <div
              className="absolute -top-8 -right-8 h-36 w-36 rounded-full blur-3xl"
              style={{ background: "rgba(234,179,8,0.12)" }}
            />
            <div
              className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.25)" }}
            >
              <Star className="h-6 w-6" style={{ color: "#fbbf24" }} />
            </div>
            <div className="relative">
              <h3 className="mb-2 text-xl font-bold">Read Reviews Faster</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                AI summarizes hundreds of reviews into pros, cons, and complaint
                themes. Skip the fake 5-star noise.
              </p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative overflow-hidden rounded-3xl p-7 flex flex-col justify-between min-h-[200px]"
            style={glassCard}
          >
            <div
              className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full blur-3xl"
              style={{ background: "rgba(34,197,94,0.1)" }}
            />
            <div
              className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <RotateCcw className="h-6 w-6" style={{ color: "#4ade80" }} />
            </div>
            <div className="relative">
              <h3 className="mb-2 text-xl font-bold">Know the Return Risk</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                We decode return policies — refund traps, hidden fees, vague
                wording — and give you a plain-English risk rating.
              </p>
            </div>
          </motion.div>

          {/* Card 4 — wide, spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative overflow-hidden rounded-3xl p-7 md:col-span-2 flex items-center gap-8 min-h-[160px]"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <div
              className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)" }}
            >
              <TrendingUp className="h-7 w-7" style={{ color: "#a5b4fc" }} />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold">One verdict. No guesswork.</h3>
              <p className="text-gray-400 leading-relaxed">
                Buy · Buy with caution · Skip — a final AI verdict based on
                every signal we collect. Because you don't buy summaries, you
                buy{" "}
                <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
                  peace of mind
                </span>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
