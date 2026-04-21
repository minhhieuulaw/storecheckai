"use client";

import { motion } from "framer-motion";
import { ExternalLink, Search, ImageIcon } from "lucide-react";
import type { PriceAnalysis, PriceVerdict, ScrapedProduct } from "@/lib/types";
import { LockedSection } from "@/components/report/common/LockedSection";

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.48, delay: 0.36, ease: EASE },
};

function priceVerdictConfig(v: PriceVerdict, exactMatch?: boolean) {
  if (v === "cheap")      return { label: "Good Deal",     color: "var(--v2-success)" };
  if (v === "fair")       return { label: "Fair Price",    color: "var(--v2-accent)"  };
  if (v === "overpriced") return { label: exactMatch ? "Overpriced" : "Cheaper Alt.", color: "var(--v2-warning)" };
  return                         { label: "High Markup",   color: "var(--v2-danger)"  };
}

function yandexImageUrl(imageUrl: string): string {
  return `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imageUrl)}`;
}

export function PriceCheckV2({
  priceAnalysis,
  products,
  isBasicPlan,
}: {
  priceAnalysis: PriceAnalysis[];
  products: ScrapedProduct[];
  isBasicPlan: boolean;
}) {
  if (isBasicPlan) {
    return <LockedSection label="Price Comparison (Amazon · AliExpress)" />;
  }

  if (priceAnalysis.length === 0 && products.length === 0) {
    return (
      <motion.div {...fadeUp}>
        <SectionChip badgeLabel="GPT-4o Vision" badgeColor="var(--v2-src-ai)" />
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: "var(--v2-surface-raised)",
            border: "1px solid var(--v2-border)",
            borderRadius: "var(--v2-radius-lg)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--v2-text-secondary)" }}>
            No product listings detected on this store.
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--v2-text-dim)" }}>
            Price comparison is available when the store exposes product data.
          </p>
        </div>
      </motion.div>
    );
  }

  if (priceAnalysis.length === 0) return null;

  return (
    <motion.div {...fadeUp}>
      <SectionChip badgeLabel="AI Estimate" badgeColor="var(--v2-src-ai)" />

      <div className="space-y-3">
        {priceAnalysis.map((item, i) => {
          const isExact = (item as unknown as { exactMatch?: boolean }).exactMatch !== false;
          const pvc = priceVerdictConfig(item.priceVerdict, isExact);
          const product = products.find((p) => p.name === item.productName);
          const aliIsLive = item.aliexpressPriceSource === "live";

          return (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--v2-surface-raised)",
                border: "1px solid var(--v2-border)",
                borderRadius: "var(--v2-radius-lg)",
                boxShadow: "var(--v2-shadow-card)",
              }}
            >
              {/* Header: image + name + verdict pill */}
              <div className="px-5 pt-4 pb-3 flex items-start gap-4">
                {product?.image && (
                  <div
                    className="h-16 w-16 rounded-xl overflow-hidden shrink-0"
                    style={{
                      border: "1px solid var(--v2-border-strong)",
                      borderRadius: "var(--v2-radius-md)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={item.identifiedAs}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: "var(--v2-text)" }}
                  >
                    {item.identifiedAs}
                  </p>
                  {!isExact && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--v2-text-dim)" }}>
                      Compared with similar products — not an exact match
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: `color-mix(in srgb, ${pvc.color} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${pvc.color} 28%, transparent)`,
                    color: pvc.color,
                  }}
                >
                  {pvc.label}
                </span>
              </div>

              {/* 3-pill price row */}
              <div
                className="grid grid-cols-3 divide-x"
                style={{ borderColor: "var(--v2-border)", borderTop: "1px solid var(--v2-border)" }}
              >
                <PricePill
                  label="This Store"
                  price={item.storePrice}
                  color="var(--v2-text)"
                />
                <PricePill
                  label={isExact ? "Amazon" : "Amazon (similar)"}
                  price={item.estimatedMarketPrice}
                  color={pvc.color}
                  badge={{ label: "AI Est.", color: "var(--v2-src-ai)" }}
                />
                {item.aliexpressPrice ? (
                  <PricePill
                    label={isExact ? "AliExpress" : "AliExpress (similar)"}
                    price={item.aliexpressPrice}
                    color="var(--v2-text-secondary)"
                    badge={
                      aliIsLive
                        ? { label: "● Live", color: "var(--v2-src-live)" }
                        : { label: "AI Est.", color: "var(--v2-src-ai)" }
                    }
                    tooltip={
                      aliIsLive
                        ? `Live price sampled from ${item.aliexpressSampleCount} AliExpress products via Official API`
                        : undefined
                    }
                  />
                ) : (
                  <div />
                )}
              </div>

              {/* Markup note + explanation */}
              {(item.markupNote || item.explanation) && (
                <div
                  className="px-5 py-3"
                  style={{
                    borderTop: "1px solid var(--v2-border)",
                    background: "var(--v2-surface)",
                  }}
                >
                  {item.markupNote && (
                    <div
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 mb-2 text-[11px] font-semibold"
                      style={{
                        background: "color-mix(in srgb, var(--v2-danger) 10%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--v2-danger) 22%, transparent)",
                        color: "var(--v2-danger)",
                      }}
                    >
                      ⚠ {item.markupNote}
                    </div>
                  )}
                  {item.explanation && (
                    <p className="text-xs leading-snug" style={{ color: "var(--v2-text-secondary)" }}>
                      {item.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Action row: 4 buttons */}
              <div
                className="px-5 py-3 flex flex-wrap gap-2"
                style={{
                  borderTop: "1px solid var(--v2-border)",
                }}
              >
                {item.googleLensUrl && (
                  <ActionButton
                    href={item.googleLensUrl}
                    Icon={ImageIcon}
                    label="Google Lens"
                    color="var(--v2-info)"
                  />
                )}
                {product?.image && (
                  <ActionButton
                    href={yandexImageUrl(product.image)}
                    Icon={ImageIcon}
                    label="Find on Yandex"
                    color="var(--v2-accent)"
                  />
                )}
                <ActionButton
                  href={item.amazonSearchUrl}
                  Icon={Search}
                  label="Amazon"
                  color="#FF9900"
                />
                <ActionButton
                  href={item.aliexpressSearchUrl}
                  Icon={Search}
                  label="AliExpress"
                  color="var(--v2-danger)"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Honesty footer */}
      <p
        className="mt-3 text-[10px] text-center px-1"
        style={{ color: "var(--v2-text-dim)" }}
      >
        Image search covers identical items. Keyword search may be off if AI misidentified the product. Links may earn a commission at no extra cost.
      </p>
    </motion.div>
  );
}

function SectionChip({ badgeLabel, badgeColor }: { badgeLabel: string; badgeColor: string }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <span
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "var(--v2-text-dim)" }}
      >
        08 · Price Check
      </span>
      <span
        className="inline-flex items-center rounded px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-wider"
        style={{
          background: `color-mix(in srgb, ${badgeColor} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${badgeColor} 30%, transparent)`,
          color: badgeColor,
        }}
      >
        {badgeLabel}
      </span>
    </div>
  );
}

function PricePill({
  label,
  price,
  color,
  badge,
  tooltip,
}: {
  label: string;
  price: string;
  color: string;
  badge?: { label: string; color: string };
  tooltip?: string;
}) {
  return (
    <div className="px-4 py-3 flex flex-col gap-1" title={tooltip}>
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] font-bold uppercase tracking-widest truncate"
          style={{ color: "var(--v2-text-muted)" }}
        >
          {label}
        </span>
        {badge && (
          <span
            className="inline-flex items-center rounded px-1 py-[1px] text-[9px] font-bold uppercase tracking-wider shrink-0"
            style={{
              background: `color-mix(in srgb, ${badge.color} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${badge.color} 28%, transparent)`,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
        )}
      </div>
      <span
        className="font-mono leading-none"
        style={{
          color,
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {price}
      </span>
    </div>
  );
}

function ActionButton({
  href,
  Icon,
  label,
  color,
}: {
  href: string;
  Icon: typeof Search;
  label: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:opacity-80 active:scale-95"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
        color,
      }}
    >
      <Icon className="h-3 w-3" />
      {label}
      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
    </a>
  );
}
