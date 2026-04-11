"use client";

import { motion } from "framer-motion";

const viewportOnce = { once: true };

export function FinalTake({ finalTake }: { finalTake: string | null | undefined }) {
  if (!finalTake) return null;

  return (
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
      <p className="text-sm text-gray-200 leading-relaxed">{finalTake}</p>
    </motion.div>
  );
}
