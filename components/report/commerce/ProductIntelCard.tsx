"use client";

import { motion } from "framer-motion";
import { Star, Package, Sparkles, Zap } from "lucide-react";
import type { DeepProductIntel } from "@/lib/types";

export function ProductIntelCard({ intel }: { intel: DeepProductIntel }) {
  const isBundle = intel.pageType === "bundle_kit" && intel.bundleComponents.length > 0;
  const isFunnel = intel.pageType === "funnel_quiz";
  const hasDiscount = intel.discountPercent != null && intel.discountPercent > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-4 rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04) 0%, rgba(59,130,246,0.03) 100%)", border: "1px solid rgba(139,92,246,0.12)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mb-2.5"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
            {isBundle ? <Package className="h-3 w-3 text-violet-400" /> : isFunnel ? <Zap className="h-3 w-3 text-amber-400" /> : <Sparkles className="h-3 w-3 text-violet-400" />}
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
              {isBundle ? "Bundle Breakdown" : isFunnel ? "Funnel Store" : "Product Details"}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-200 leading-snug">
            {intel.brand && <span className="text-violet-400">{intel.brand} </span>}
            {intel.productName}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">{intel.category}{intel.limitedEdition ? " · Limited Edition" : ""}</p>
        </div>

        {/* Price badge */}
        {intel.currentPrice != null && (
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-white">${intel.currentPrice}</p>
            {intel.originalPrice != null && hasDiscount && (
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[11px] text-gray-600 line-through">${intel.originalPrice}</span>
                <span className="text-[10px] font-bold text-green-400 px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(34,197,94,0.1)" }}>
                  {intel.discountPercent}% off
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bundle components */}
      {isBundle && (
        <div className="mx-5 mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-3 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">What&apos;s inside</p>
          </div>
          {intel.bundleComponents.map((comp, i) => (
            <div key={i} className="px-3 py-2 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded flex items-center justify-center text-[9px] font-bold text-violet-400"
                  style={{ background: "rgba(139,92,246,0.1)" }}>{i + 1}</div>
                <span className="text-xs text-gray-300">{comp.name}</span>
                {comp.size && <span className="text-[10px] text-gray-600">({comp.size})</span>}
              </div>
              {comp.fullSizePriceEstimate && (
                <span className="text-[10px] text-gray-600">~{comp.fullSizePriceEstimate} full size</span>
              )}
            </div>
          ))}
          {intel.bundleTotalValue && (
            <div className="px-3 py-2 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(34,197,94,0.03)" }}>
              <span className="text-[11px] font-medium text-green-400">Total value: {intel.bundleTotalValue}</span>
              {intel.bundleSavings && <span className="text-[11px] font-bold text-green-400">{intel.bundleSavings}</span>}
            </div>
          )}
        </div>
      )}

      {/* Details grid — marketing claims removed (non-trust data) */}
      <div className="px-5 pb-4 flex flex-wrap gap-x-4 gap-y-2">
        {intel.targetConcerns.length > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Best for</p>
            <div className="flex flex-wrap gap-1">
              {intel.targetConcerns.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full text-blue-300"
                  style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>{c}</span>
              ))}
            </div>
          </div>
        )}
        {intel.ingredients.length > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Key ingredients</p>
            <p className="text-[11px] text-gray-400">{intel.ingredients.slice(0, 6).join(" · ")}</p>
          </div>
        )}
        {intel.onPageRating != null && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">On-site rating</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-amber-400">{intel.onPageRating}</span>
              {intel.onPageReviewCount != null && (
                <span className="text-[10px] text-gray-600">({intel.onPageReviewCount.toLocaleString()} reviews)</span>
              )}
            </div>
          </div>
        )}
        {intel.funnelSignals.length > 0 && (
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Store signals</p>
            <div className="flex flex-wrap gap-1">
              {intel.funnelSignals.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full text-gray-400"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Funnel warning */}
      {isFunnel && (
        <div className="mx-5 mb-4 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <p className="text-[11px] text-amber-400">
            <Zap className="inline h-3 w-3 mr-1" />
            This store uses a quiz/funnel to sell — the actual product may differ from what you see initially.
          </p>
        </div>
      )}
    </motion.div>
  );
}
