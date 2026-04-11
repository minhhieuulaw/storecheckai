"use client";

import { motion } from "framer-motion";
import { Users, UserX } from "lucide-react";
import { SectionHeader } from "@/components/report/layout/SectionHeader";
import { LockedSection } from "@/components/report/common/LockedSection";

const viewportOnce = { once: true };

export function WhoShouldBuyAvoid({
  whoShouldBuy,
  whoShouldAvoid,
  isBasicPlan,
}: {
  whoShouldBuy: string | null | undefined;
  whoShouldAvoid: string | null | undefined;
  isBasicPlan: boolean;
}) {
  if (isBasicPlan) return <LockedSection label="Who Should Buy / Avoid" />;
  if (!whoShouldBuy && !whoShouldAvoid) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4 }}
      className="mb-4">
      <SectionHeader label="Who Is This For?" />
      <div className="grid gap-3 sm:grid-cols-2">
        {whoShouldBuy && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.08)" }}>
            <p className="text-xs font-semibold text-green-400 mb-2.5 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Good fit for
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">{whoShouldBuy}</p>
          </div>
        )}
        {whoShouldAvoid && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}>
            <p className="text-xs font-semibold text-red-400 mb-2.5 flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5" /> Think twice if you…
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">{whoShouldAvoid}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
