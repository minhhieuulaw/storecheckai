"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const EASE = [0.4, 0, 0.2, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE },
};

export function StoreHero({
  storeName,
  url,
  domain,
  analyzedAt,
}: {
  storeName: string;
  url: string;
  domain: string;
  analyzedAt: string | number | Date;
}) {
  return (
    <motion.div {...fadeUp} className="mb-4 rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5) 40%, rgba(139,92,246,0.5) 60%, transparent)" }} />

      <div className="flex items-center gap-4 px-5 py-5">
        {/* Logo with glow */}
        <div className="relative shrink-0">
          <div className="absolute -inset-2 rounded-2xl blur-lg opacity-25"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
          <div className="relative h-14 w-14 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt="" width={36} height={36} className="rounded-lg"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
        </div>

        {/* Store info */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-white leading-tight truncate">{storeName}</h1>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors group">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate group-hover:underline underline-offset-2">{domain}</span>
          </a>
        </div>

        {/* Analyzed badge */}
        <div className="shrink-0">
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
            <span className="text-[11px] font-medium text-indigo-300">
              {new Date(analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
