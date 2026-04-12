"use client";

import { motion } from "framer-motion";
import FBAdChecker from "@/components/FBAdChecker";
import { SectionHeader } from "@/components/report/layout/SectionHeader";

const viewportOnce = { once: true };

export function FacebookAdDeepCheck() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4 }}
      className="mb-8">
      <SectionHeader label="Facebook Ad Check" />
      <FBAdChecker />
    </motion.div>
  );
}
