"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { PriceAnalysis, PriceVerdict, ScrapedProduct } from "@/lib/types";
import { SectionHeader } from "@/components/report/layout/SectionHeader";
import { LockedSection } from "@/components/report/common/LockedSection";

const viewportOnce = { once: true };

function priceVerdictConfig(v: PriceVerdict, exactMatch?: boolean) {
  if (v === "cheap")      return { label: "Good Deal",   color: "#4ade80", bg: "rgba(34,197,94,0.12)"  };
  if (v === "fair")       return { label: "Fair Price",  color: "#38bdf8", bg: "rgba(56,189,248,0.12)" };
  if (v === "overpriced") return { label: exactMatch ? "Overpriced" : "Cheaper Alternatives", color: "#fbbf24", bg: "rgba(234,179,8,0.12)" };
  return                         { label: "High Markup", color: "#f87171", bg: "rgba(239,68,68,0.12)"  };
}

export function PriceCheck({ priceAnalysis, products, isBasicPlan }: {
  priceAnalysis: PriceAnalysis[];
  products: ScrapedProduct[];
  isBasicPlan: boolean;
}) {
  if (isBasicPlan) {
    return <LockedSection label="Price Comparison (Amazon · AliExpress)" />;
  }

  if (priceAnalysis.length === 0 && products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.4 }}
        className="mb-5">
        <SectionHeader label="Price Check" badge="GPT-4o Vision" />
        <div className="rounded-2xl p-5 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm text-gray-500">No product listings detected on this store.</p>
          <p className="text-xs text-gray-700 mt-1">Price comparison is available when the store exposes product data.</p>
        </div>
      </motion.div>
    );
  }

  if (priceAnalysis.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4 }}
      className="mb-5">
      <SectionHeader label="Price Check" badge="GPT-4o Vision" />

      <div className="space-y-3">
        {priceAnalysis.map((item, i) => {
          const isExact = (item as unknown as { exactMatch?: boolean }).exactMatch !== false;
          const pvc     = priceVerdictConfig(item.priceVerdict, isExact);
          const product = products.find(p => p.name === item.productName);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className="group rounded-2xl overflow-hidden transition-all"
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
              }}>
              <div className="flex gap-4 p-4">
                {/* Product image */}
                {product?.image && (
                  <div
                    className="shrink-0 h-24 w-24 rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image} alt={item.identifiedAs}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {/* Name + badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-200 leading-tight">{item.identifiedAs}</p>
                      {!isExact && (
                        <p className="text-[10px] text-gray-500 mt-0.5">Compared with similar products — not an exact match</p>
                      )}
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: pvc.bg, color: pvc.color }}>
                      {pvc.label}
                    </span>
                  </div>
                  {/* Prices */}
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">This Store</span>
                      <span className="text-sm font-bold text-gray-100">{item.storePrice}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                        {isExact ? "Amazon" : "Amazon (similar)"}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: pvc.color }}>{item.estimatedMarketPrice}</span>
                    </div>
                    {item.aliexpressPrice && (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                          {isExact ? "AliExpress" : "AliExpress (similar)"}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">{item.aliexpressPrice}</span>
                        {item.aliexpressPriceSource === "live" ? (
                          <span
                            className="inline-flex items-center gap-0.5 rounded px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider"
                            title={`Live price sampled from ${item.aliexpressSampleCount} AliExpress products via Official API`}
                            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.32)", color: "#34d399" }}>
                            ● Live
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center rounded px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider"
                            title="AI estimate from GPT-4o Vision based on similar products — not a live scrape. Actual prices may differ."
                            style={{ background: "rgba(251,146,60,0.10)", border: "1px solid rgba(251,146,60,0.30)", color: "#fdba74" }}>
                            AI Est.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {item.markupNote && (
                    <div
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold mb-2"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#fca5a5" }}>
                      ⚠ {item.markupNote}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.explanation}</p>
                  {/* Compare links */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.googleLensUrl && (
                      <a href={item.googleLensUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95"
                        style={{ background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc" }}>
                        🔍 Find by Image <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    <a href={item.amazonSearchUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:opacity-80 active:scale-95"
                      style={{ background: "rgba(255,153,0,0.08)", border: "1px solid rgba(255,153,0,0.18)", color: "#ffa726" }}>
                      Amazon <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <a href={item.aliexpressSearchUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:opacity-80 active:scale-95"
                      style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.14)", color: "#f87171" }}>
                      AliExpress <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-700 mt-2 text-right">
        Links may earn us a small commission at no extra cost to you.
      </p>
    </motion.div>
  );
}
