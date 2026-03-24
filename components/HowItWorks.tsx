"use client";

import { motion } from "framer-motion";
import { Link2, Cpu, FileCheck } from "lucide-react";

const steps = [
  {
    icon: Link2,
    step: "01",
    title: "Paste your link",
    desc: "Drop in any product URL or store domain. Shopify, Amazon, or any public e-commerce page.",
    accent: "rgba(99,102,241,0.2)",
    accentBorder: "rgba(99,102,241,0.4)",
    iconColor: "#818cf8",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI analyzes everything",
    desc: "We scan store signals, scrape reviews, check return policy, and detect suspicious patterns.",
    accent: "rgba(139,92,246,0.2)",
    accentBorder: "rgba(139,92,246,0.4)",
    iconColor: "#c084fc",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Get your report",
    desc: "A full trust breakdown — score, return risk, review confidence, red flags, and a final verdict.",
    accent: "rgba(6,182,212,0.15)",
    accentBorder: "rgba(6,182,212,0.35)",
    iconColor: "#22d3ee",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{
              background: "rgba(99,102,241,0.12)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          >
            How it works
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Three steps.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)" }}
            >
              Under 30 seconds.
            </span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid gap-4 md:grid-cols-3">
          {/* Connector */}
          <div
            className="absolute top-10 left-[22%] right-[22%] hidden h-px md:block"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.4), transparent)",
            }}
          />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative flex flex-col items-center text-center rounded-3xl p-8"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Step number */}
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold font-mono"
                style={{
                  background: s.accent,
                  border: `1px solid ${s.accentBorder}`,
                  color: s.iconColor,
                }}
              >
                {s.step}
              </div>

              {/* Icon */}
              <div
                className="mb-6 mt-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: s.accent, border: `1px solid ${s.accentBorder}` }}
              >
                <s.icon className="h-7 w-7" style={{ color: s.iconColor }} />
              </div>

              <h3 className="mb-3 text-xl font-bold">{s.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
