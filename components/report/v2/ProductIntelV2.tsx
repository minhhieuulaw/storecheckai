"use client";

import { motion } from "framer-motion";
import { Package, Sparkles, Zap, Star } from "lucide-react";
import type { DeepProductIntel } from "@/lib/types";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay: 0.32, ease: EASE },
};

export function ProductIntelV2({ intel }: { intel: DeepProductIntel }) {
  const isBundle = intel.pageType === "bundle_kit" && intel.bundleComponents.length > 0;
  const isFunnel = intel.pageType === "funnel_quiz";
  const hasDiscount = intel.discountPercent != null && intel.discountPercent > 0;
  const TypeIcon = isBundle ? Package : isFunnel ? Zap : Sparkles;
  const typeLabel = isBundle ? "Bundle Breakdown" : isFunnel ? "Funnel Store" : "Product Details";

  return (
    <motion.div {...fadeUp}>
      {/* Section chip + badge */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--v2-text-dim)" }}
        >
          07 · Product Intel
        </span>
        <span
          className="inline-flex items-center rounded px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "color-mix(in srgb, var(--v2-info) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--v2-info) 30%, transparent)",
            color: "var(--v2-info)",
          }}
        >
          AI Extracted
        </span>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--v2-info) 4%, var(--v2-surface-raised)) 0%, var(--v2-surface-raised) 100%)",
          border: "1px solid var(--v2-border)",
          borderRadius: "var(--v2-radius-lg)",
          boxShadow: "var(--v2-shadow-card)",
        }}
      >
        {/* Header: type + name + price */}
        <div
          className="px-5 py-4 flex items-start justify-between gap-4"
          style={{ borderBottom: isBundle ? "1px solid var(--v2-border)" : "none" }}
        >
          <div className="min-w-0 flex-1">
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 mb-2.5"
              style={{
                background: "color-mix(in srgb, var(--v2-info) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--v2-info) 25%, transparent)",
              }}
            >
              <TypeIcon className="h-3 w-3" style={{ color: "var(--v2-info)" }} />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--v2-info)" }}
              >
                {typeLabel}
              </span>
            </div>

            {intel.brand && (
              <span
                className="text-[11px] uppercase tracking-widest font-semibold mr-1"
                style={{ color: "var(--v2-info)" }}
              >
                {intel.brand}
              </span>
            )}
            <p
              className="inline leading-snug"
              style={{
                color: "var(--v2-text)",
                fontFamily: "var(--v2-font-display)",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {intel.productName}
            </p>
            <p
              className="text-[11px] mt-1"
              style={{ color: "var(--v2-text-muted)" }}
            >
              {intel.category}
              {intel.limitedEdition ? " · Limited Edition" : ""}
            </p>
          </div>

          {/* Price */}
          {intel.currentPrice != null && (
            <div className="text-right shrink-0">
              <p
                className="leading-none font-mono"
                style={{
                  color: "var(--v2-text)",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                ${intel.currentPrice}
              </p>
              {intel.originalPrice != null && hasDiscount && (
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <span
                    className="text-[10px] font-mono line-through"
                    style={{ color: "var(--v2-text-dim)" }}
                  >
                    ${intel.originalPrice}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: "color-mix(in srgb, var(--v2-success) 12%, transparent)",
                      color: "var(--v2-success)",
                    }}
                  >
                    {intel.discountPercent}% off
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bundle components */}
        {isBundle && (
          <div>
            <div
              className="px-5 py-2"
              style={{ background: "var(--v2-surface)" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--v2-text-muted)" }}
              >
                What&apos;s inside
              </p>
            </div>
            {intel.bundleComponents.map((comp, i) => (
              <div
                key={i}
                className="px-5 py-2.5 flex items-center justify-between"
                style={{ borderTop: "1px solid var(--v2-border)" }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      background: "color-mix(in srgb, var(--v2-info) 12%, transparent)",
                      color: "var(--v2-info)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs truncate" style={{ color: "var(--v2-text)" }}>
                    {comp.name}
                  </span>
                  {comp.size && (
                    <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--v2-text-dim)" }}>
                      ({comp.size})
                    </span>
                  )}
                </div>
                {comp.fullSizePriceEstimate && (
                  <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--v2-text-muted)" }}>
                    ~{comp.fullSizePriceEstimate} full
                  </span>
                )}
              </div>
            ))}
            {intel.bundleTotalValue && (
              <div
                className="px-5 py-2.5 flex items-center justify-between"
                style={{
                  borderTop: "1px solid var(--v2-border)",
                  background: "color-mix(in srgb, var(--v2-success) 4%, transparent)",
                }}
              >
                <span className="text-xs" style={{ color: "var(--v2-success)" }}>
                  Total value: <span className="font-mono font-semibold">{intel.bundleTotalValue}</span>
                </span>
                {intel.bundleSavings && (
                  <span className="text-xs font-bold font-mono" style={{ color: "var(--v2-success)" }}>
                    {intel.bundleSavings}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Details: 2-col grid */}
        <div
          className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"
          style={{ borderTop: "1px solid var(--v2-border)" }}
        >
          {intel.targetConcerns.length > 0 && (
            <Detail label="Best for">
              <div className="flex flex-wrap gap-1">
                {intel.targetConcerns.map((c, i) => (
                  <Chip key={i} color="var(--v2-accent)">{c}</Chip>
                ))}
              </div>
            </Detail>
          )}
          {intel.ingredients.length > 0 && (
            <Detail label="Key ingredients">
              <p className="text-xs font-mono" style={{ color: "var(--v2-text-secondary)" }}>
                {intel.ingredients.slice(0, 6).join(" · ")}
              </p>
            </Detail>
          )}
          {intel.onPageRating != null && (
            <Detail label="On-site rating">
              <div className="flex items-center gap-1.5">
                <Star className="h-3 w-3" style={{ color: "var(--v2-warning)", fill: "var(--v2-warning)" }} />
                <span className="text-sm font-semibold font-mono" style={{ color: "var(--v2-warning)" }}>
                  {intel.onPageRating}
                </span>
                {intel.onPageReviewCount != null && (
                  <span className="text-[10px] font-mono" style={{ color: "var(--v2-text-dim)" }}>
                    ({intel.onPageReviewCount.toLocaleString()})
                  </span>
                )}
              </div>
            </Detail>
          )}
          {intel.funnelSignals.length > 0 && (
            <Detail label="Store signals">
              <div className="flex flex-wrap gap-1">
                {intel.funnelSignals.map((s, i) => (
                  <Chip key={i} color="var(--v2-text-muted)">{s}</Chip>
                ))}
              </div>
            </Detail>
          )}
        </div>

        {/* Funnel warning */}
        {isFunnel && (
          <div
            className="px-5 py-3 flex items-start gap-2"
            style={{
              background: "color-mix(in srgb, var(--v2-warning) 6%, transparent)",
              borderTop: "1px solid color-mix(in srgb, var(--v2-warning) 22%, transparent)",
            }}
          >
            <Zap
              className="h-3.5 w-3.5 shrink-0 mt-0.5"
              style={{ color: "var(--v2-warning)" }}
            />
            <p
              className="text-xs leading-snug"
              style={{ color: "var(--v2-text-secondary)" }}
            >
              This store uses a quiz/funnel to sell — the actual product may differ from what you see initially.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
        style={{ color: "var(--v2-text-dim)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex text-[10px] px-2 py-0.5 rounded-full"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
        color,
      }}
    >
      {children}
    </span>
  );
}
