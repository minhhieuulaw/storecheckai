"use client";

import { motion } from "framer-motion";
import type { StoreSignal } from "@/lib/types";
import { HealthBucket } from "@/components/report/status/HealthBucket";

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUpDelayed = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});

export function HealthSnapshot({
  passing,
  warnings,
  failures,
}: {
  passing: StoreSignal[];
  warnings: StoreSignal[];
  failures: StoreSignal[];
}) {
  return (
    <motion.div {...fadeUpDelayed(0.13)} className="mb-5">
      <div className="grid grid-cols-3 gap-2.5 mb-2">
        <HealthBucket type="pass" label="Looking Good"    count={passing.length}  signals={passing}  />
        <HealthBucket type="warn" label="Worth Reviewing" count={warnings.length} signals={warnings} />
        <HealthBucket type="fail" label="Concerns"        count={failures.length} signals={failures} />
      </div>
      <p className="text-center text-[11px] text-gray-700">Tap each card to expand</p>
    </motion.div>
  );
}
