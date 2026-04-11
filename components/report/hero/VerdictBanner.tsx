"use client";

import { motion } from "framer-motion";
import { RotateCcw, Truck, CreditCard, ShieldCheck } from "lucide-react";
import type React from "react";
import { FactPill } from "@/components/report/common/FactPill";
import { ScoreRing } from "@/components/report/hero/ScoreRing";

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUpDelayed = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE },
});

export interface VerdictConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  Icon: React.ElementType;
}

export interface Pill {
  text: string;
  color: string;
}

export function VerdictBanner({
  verdictConfig,
  verdictReason,
  trustScore,
  trustColor,
  trustLabel,
  returnPill,
  shippingPill,
  paymentText,
  paymentColor,
}: {
  verdictConfig: VerdictConfig;
  verdictReason: string;
  trustScore: number;
  trustColor: string;
  trustLabel: string;
  returnPill: Pill;
  shippingPill: Pill;
  paymentText: string;
  paymentColor: string;
}) {
  const { Icon: VIcon, label, color, bg, border, glow } = verdictConfig;

  return (
    <motion.div
      {...fadeUpDelayed(0.07)}
      className="mb-4 rounded-3xl p-5 sm:p-6"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: `0 0 48px ${glow}`,
      }}>

      {/* Top row: icon + verdict text + score ring */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className="rounded-2xl p-3 shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}28` }}>
          <VIcon className="h-6 w-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold leading-tight" style={{ color }}>
            {label}
          </h2>
          <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">{verdictReason}</p>
        </div>
        {/* Trust score ring — visible at a glance */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <ScoreRing score={trustScore} color={trustColor} />
          <p className="text-[10px] font-medium text-gray-700 uppercase tracking-wider">Trust</p>
        </div>
      </div>

      {/* Fact pills */}
      <div className="flex flex-wrap gap-2">
        <FactPill text={returnPill.text}   color={returnPill.color}   Icon={RotateCcw}  />
        <FactPill text={shippingPill.text} color={shippingPill.color} Icon={Truck}      />
        <FactPill text={paymentText}       color={paymentColor}       Icon={CreditCard} />
        <FactPill text={`Trust: ${trustLabel}`} color={trustColor}    Icon={ShieldCheck} />
      </div>
    </motion.div>
  );
}
