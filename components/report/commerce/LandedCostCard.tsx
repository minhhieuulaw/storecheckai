"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle } from "lucide-react";

export function LandedCostCard({ cost }: {
  cost: { productPriceUsd: number; estimatedShippingUsd: number; estimatedDutyUsd: number; totalUsd: number; shippingTimeText: string; afterSalesRisk: "low" | "medium" | "high"; note: string };
}) {
  const riskColor = cost.afterSalesRisk === "high" ? "#ef4444" : cost.afterSalesRisk === "medium" ? "#eab308" : "#22c55e";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-5 rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>

      <div className="px-5 pt-4 pb-3">
        <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mb-3"
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <Package className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Total Cost to Your Door (US)</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Product</p>
            <p className="text-sm font-bold text-white">${cost.productPriceUsd.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Shipping</p>
            <p className="text-sm font-bold text-gray-300">
              {cost.estimatedShippingUsd > 0 ? `$${cost.estimatedShippingUsd.toFixed(2)}` : "Free*"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Import Duty</p>
            <p className="text-sm font-bold text-gray-300">
              {cost.estimatedDutyUsd > 0 ? `$${cost.estimatedDutyUsd.toFixed(2)}` : "$0"}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Estimated Total</p>
            <p className="text-lg font-black text-white">${cost.totalUsd.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider">Shipping time</p>
            <p className="text-xs font-semibold text-gray-300">{cost.shippingTimeText}</p>
          </div>
        </div>
      </div>

      {/* After-sales warning */}
      <div className="px-5 pb-4">
        <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
          style={{ background: `${riskColor}0d`, border: `1px solid ${riskColor}33` }}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: riskColor }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: riskColor }}>
              After-sales risk: {cost.afterSalesRisk}
            </p>
            <p className="text-[11px] text-gray-300 leading-snug">{cost.note}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
