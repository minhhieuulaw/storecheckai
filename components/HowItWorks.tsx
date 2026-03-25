"use client";

import { motion } from "framer-motion";
import { Link2, Cpu, FileCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const STEP_META = [
  { icon: Link2,     accent: "rgba(99,102,241,0.2)",  accentBorder: "rgba(99,102,241,0.4)",  iconColor: "#818cf8" },
  { icon: Cpu,       accent: "rgba(139,92,246,0.2)",  accentBorder: "rgba(139,92,246,0.4)",  iconColor: "#c084fc" },
  { icon: FileCheck, accent: "rgba(6,182,212,0.15)",  accentBorder: "rgba(6,182,212,0.35)",  iconColor: "#22d3ee" },
];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            {t.howItWorks.badge}
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t.howItWorks.heading}{" "}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)" }}>
              {t.howItWorks.headingAccent}
            </span>
          </h2>
        </motion.div>

        <div className="relative grid gap-4 md:grid-cols-3">
          <div
            className="absolute top-10 left-[22%] right-[22%] hidden h-px md:block"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.4), transparent)" }}
          />

          {t.howItWorks.steps.map((step, i) => {
            const meta = STEP_META[i];
            const Icon = meta.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center rounded-3xl p-8"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold font-mono"
                  style={{ background: meta.accent, border: `1px solid ${meta.accentBorder}`, color: meta.iconColor }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  className="mb-6 mt-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: meta.accent, border: `1px solid ${meta.accentBorder}` }}
                >
                  <Icon className="h-7 w-7" style={{ color: meta.iconColor }} />
                </div>
                <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
