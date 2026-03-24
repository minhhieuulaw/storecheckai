"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const items = [
  {
    q: "What sites does StorecheckAI support?",
    a: "StorecheckAI works with most e-commerce URLs — Shopify stores, Amazon product pages, and general online shops. If the page is publicly accessible, we can analyze it.",
  },
  {
    q: "How accurate is the trust score?",
    a: "Our AI analyzes dozens of signals: domain age, HTTPS, contact info, policy pages, review patterns, and more. No tool is 100% perfect, but StorecheckAI catches the most common red flags that scammy stores share.",
  },
  {
    q: "Can I trust the review summary?",
    a: "We flag suspicious review patterns (generic praise, clustering, sentiment skew) and label confidence accordingly. We don't call them fake — we show you the signals and let you decide.",
  },
  {
    q: "Is my search history stored?",
    a: "Free users: checks are not saved. Pro users can optionally save and revisit past reports from their dashboard.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "Free gives 3 checks/month with a basic summary and verdict. Pro unlocks unlimited checks, full return risk analysis, suspicious review breakdown, and saved reports.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
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
            FAQ
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">Common questions</h2>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="overflow-hidden rounded-2xl transition-all"
              style={{
                background: open === i ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
                border: open === i
                  ? "1px solid rgba(99,102,241,0.25)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-semibold"
              >
                <span>{item.q}</span>
                <div
                  className="ml-4 shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: open === i ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {open === i
                    ? <Minus className="h-3.5 w-3.5" style={{ color: "#a5b4fc" }} />
                    : <Plus className="h-3.5 w-3.5 text-gray-400" />
                  }
                </div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
