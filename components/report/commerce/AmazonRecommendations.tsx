"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Star, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/report/layout/SectionHeader";

export function AmazonRecommendations({ recommendations }: {
  recommendations: { name: string; estimatedPrice: string; rating: number; reviewCount: string; whyBuy: string; searchUrl: string; asin?: string; productUrl?: string; imageUrl?: string; isPrime?: boolean; isBestSeller?: boolean; source?: "amazon-live" | "ai-estimated" }[];
}) {
  const isLive = recommendations[0]?.source === "amazon-live";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-5">
      <SectionHeader
        label={isLive ? "Top Alternatives Worth Checking Out" : "Suggested Search Alternatives"}
        badge={isLive ? "Live Amazon Data" : "AI Suggestions"}
      />

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(255,153,0,0.03) 0%, rgba(255,200,50,0.02) 100%)", border: "1px solid rgba(255,153,0,0.12)" }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2.5"
          style={{ background: "rgba(255,153,0,0.06)", borderBottom: "1px solid rgba(255,153,0,0.1)" }}>
          <ShoppingCart className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">
            {isLive
              ? `${recommendations.length} verified Amazon alternatives`
              : `${recommendations.length} filtered Amazon searches`}
          </span>
          {isLive ? (
            <span className="ml-auto text-[10px] font-medium text-green-500 px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(34,197,94,0.08)" }}>
              Direct product links
            </span>
          ) : (
            <span className="ml-auto text-[10px] font-medium text-gray-500 px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              Price-filtered search
            </span>
          )}
        </div>

        {/* Product cards */}
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {recommendations.map((rec, i) => (
            <a
              key={i}
              href={rec.productUrl || rec.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 px-4 py-3.5 transition-all hover:bg-white/[0.04] group"
              style={{ borderBottom: i < recommendations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>

              {/* Thumbnail with rank badge */}
              <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: rec.imageUrl ? "rgba(255,255,255,0.95)" : "rgba(255,153,0,0.08)", border: "1px solid rgba(255,153,0,0.15)" }}>
                  {rec.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rec.imageUrl} alt={rec.name} className="h-full w-full object-contain p-1" loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<svg class="h-6 w-6 text-amber-500/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'; }} />
                  ) : (
                    <ShoppingCart className="h-6 w-6 text-amber-500/40" />
                  )}
                </div>
                {/* Rank badge */}
                <div className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: i === 0 ? "linear-gradient(135deg, #ff9900, #ffb347)" : i === 1 ? "linear-gradient(135deg, #94a3b8, #cbd5e1)" : "rgba(255,255,255,0.1)",
                    color: i <= 1 ? "#000" : "#999",
                    border: "2px solid rgba(10,10,20,1)",
                  }}>
                  {i + 1}
                </div>
              </div>

              {/* Product details */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-200 leading-snug mb-1.5 group-hover:text-amber-300 transition-colors line-clamp-2">
                  {rec.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {/* Stars */}
                  <div className="flex items-center gap-1">
                    <div className="flex gap-px">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="h-2.5 w-2.5"
                          style={{ color: s <= Math.round(rec.rating) ? "#f59e0b" : "rgba(255,255,255,0.1)", fill: s <= Math.round(rec.rating) ? "#f59e0b" : "transparent" }} />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-amber-400">{rec.rating}</span>
                    <span className="text-[10px] text-gray-600">({rec.reviewCount})</span>
                  </div>
                  {/* Price pill */}
                  <span className="text-xs font-bold text-green-400 px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(34,197,94,0.08)" }}>
                    {rec.estimatedPrice}
                  </span>
                  {/* Badges */}
                  {rec.isPrime && (
                    <span className="text-[10px] font-medium text-blue-400 px-1.5 py-0.5 rounded-md"
                      style={{ background: "rgba(59,130,246,0.08)" }}>
                      Prime
                    </span>
                  )}
                  {rec.isBestSeller && (
                    <span className="text-[10px] font-medium text-orange-400 px-1.5 py-0.5 rounded-md"
                      style={{ background: "rgba(249,115,22,0.08)" }}>
                      Best Seller
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{rec.whyBuy}</p>
              </div>

              {/* CTA arrow */}
              <div className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all group-hover:bg-amber-500/10"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <ExternalLink className="h-3.5 w-3.5 text-gray-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,153,0,0.08)" }}>
          <p className="text-[10px] text-gray-600">
            Links may earn us a small commission at no extra cost to you.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
