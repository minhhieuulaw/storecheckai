"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, ease: EASE },
};

function formatRelative(date: string | number | Date): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function StoreHeroV2({
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
    <motion.div
      {...fadeUp}
      className="h-full rounded-2xl p-6 flex flex-col justify-between"
      style={{
        background: "var(--v2-surface-raised)",
        border: "1px solid var(--v2-border)",
        borderRadius: "var(--v2-radius-lg)",
        boxShadow: "var(--v2-shadow-card)",
      }}
    >
      {/* Top row: section chip + analyzed at */}
      <div className="flex items-center justify-between mb-5">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--v2-text-dim)" }}
        >
          01 · Store
        </span>
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{
            background: "var(--v2-accent-glow)",
            border: "1px solid var(--v2-accent)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "var(--v2-accent)" }}
          />
          <span
            className="text-[10px] font-semibold"
            style={{ color: "var(--v2-accent)" }}
          >
            Analyzed {formatRelative(analyzedAt)}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center gap-5">
        {/* Logo 64px */}
        <div className="relative shrink-0">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{
              background: "var(--v2-surface)",
              border: "1px solid var(--v2-border-strong)",
              borderRadius: "var(--v2-radius-md)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
              alt=""
              width={40}
              height={40}
              className="rounded-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Name + domain */}
        <div className="min-w-0 flex-1">
          <h1
            className="truncate leading-tight"
            style={{
              color: "var(--v2-text)",
              fontFamily: "var(--v2-font-display)",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.015em",
            }}
          >
            {storeName}
          </h1>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 rounded-md px-2 py-1 font-mono transition-colors group"
            style={{
              background: "var(--v2-surface)",
              border: "1px solid var(--v2-border)",
              color: "var(--v2-text-secondary)",
              fontSize: 12,
            }}
          >
            <span className="truncate">{domain}</span>
            <ExternalLink
              className="h-3 w-3 shrink-0 transition-colors"
              style={{ color: "var(--v2-text-dim)" }}
            />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
