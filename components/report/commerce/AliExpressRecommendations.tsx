"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Star, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/report/layout/SectionHeader";

export function AliExpressRecommendations({ recommendations }: {
  recommendations: { productId: string; name: string; price: string; priceNumeric: number; rating: number | null; ordersText: string; imageUrl: string | null; productUrl: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-5">
      <SectionHeader label="Cheaper on AliExpress" badge="Live Data" />

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(239,68,68,0.01) 100%)", border: "1px solid rgba(239,68,68,0.12)" }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2.5"
          style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
          <ShoppingCart className="h-4 w-4 text-red-400" />
          <span className="text-sm font-semibold text-red-300">
            {recommendations.length} wholesale alternatives
          </span>
          <span className="ml-auto text-[10px] font-medium text-green-500 px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(34,197,94,0.08)" }}>
            Direct product links
          </span>
        </div>

        {/* Product cards */}
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {recommendations.map((rec, i) => (
            <a
              key={rec.productId}
              href={rec.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 px-4 py-3.5 transition-all hover:bg-white/[0.04] group"
              style={{ borderBottom: i < recommendations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>

              {/* Thumbnail with rank badge */}
              <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: rec.imageUrl ? "rgba(255,255,255,0.95)" : "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  {rec.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rec.imageUrl} alt={rec.name} className="h-full w-full object-contain p-1" loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <ShoppingCart className="h-6 w-6 text-red-500/40" />
                  )}
                </div>
                <div className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: i === 0 ? "linear-gradient(135deg, #ef4444, #f87171)" : i === 1 ? "linear-gradient(135deg, #94a3b8, #cbd5e1)" : "rgba(255,255,255,0.1)",
                    color: i <= 1 ? "#000" : "#999",
                    border: "2px solid rgba(10,10,20,1)",
                  }}>
                  {i + 1}
                </div>
              </div>

              {/* Product details */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-200 leading-snug mb-1.5 group-hover:text-red-300 transition-colors line-clamp-2">
                  {rec.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {rec.rating != null && (
                    <div className="flex items-center gap-1">
                      <div className="flex gap-px">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className="h-2.5 w-2.5"
                            style={{ color: s <= Math.round(rec.rating!) ? "#f59e0b" : "rgba(255,255,255,0.1)", fill: s <= Math.round(rec.rating!) ? "#f59e0b" : "transparent" }} />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-amber-400">{rec.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <span className="text-xs font-bold text-green-400 px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(34,197,94,0.08)" }}>
                    {rec.price}
                  </span>
                  {rec.ordersText && (
                    <span className="text-[10px] font-medium text-red-400 px-1.5 py-0.5 rounded-md"
                      style={{ background: "rgba(239,68,68,0.08)" }}>
                      {rec.ordersText}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all group-hover:bg-red-500/10"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <ExternalLink className="h-3.5 w-3.5 text-gray-600 group-hover:text-red-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
