"use client";

import { motion } from "framer-motion";
import { Star, ExternalLink } from "lucide-react";
import type { Report, TrustpilotReview } from "@/lib/types";
import { LockedSection } from "@/components/report/common/LockedSection";

const viewportOnce = { once: true };

export function TrustpilotPanel({ report, isBasicPlan }: { report: Report; isBasicPlan: boolean }) {
  if (isBasicPlan) return <LockedSection label="Trustpilot Reviews" />;
  if (report.trustpilotRating == null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.4 }}
      className="mb-4 rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
        <div>
          {/* Trustpilot badge */}
          <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mb-3"
            style={{ background: "rgba(0,182,122,0.12)", border: "1px solid rgba(0,182,122,0.2)" }}>
            <Star className="h-3 w-3" style={{ color: "#00b67a", fill: "#00b67a" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00b67a" }}>Trustpilot</span>
          </div>
          {/* Big rating */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white leading-none">{report.trustpilotRating.toFixed(1)}</span>
            <div className="pb-0.5">
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map(s => {
                  const r = report.trustpilotRating!;
                  const starColor = r >= 4 ? "#00b67a" : r >= 3 ? "#fbbf24" : r >= 2 ? "#f97316" : "#ef4444";
                  const filled = s <= Math.round(r);
                  return (
                    <Star key={s} className="h-3.5 w-3.5"
                      style={{ color: filled ? starColor : "rgba(255,255,255,0.12)", fill: filled ? starColor : "transparent" }} />
                  );
                })}
              </div>
              <span className="text-[11px] text-gray-500">{(report.trustpilotReviewCount ?? 0).toLocaleString()} reviews</span>
            </div>
          </div>
        </div>
        <a href={`https://www.trustpilot.com/review/${report.domain}`}
          target="_blank" rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1">
          View all <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* ── Structured Reviews (good + bad) ── */}
      {(() => {
        const goodRevs = (report.trustpilotGoodReviews ?? []) as TrustpilotReview[];
        const badRevs  = (report.trustpilotBadReviews ?? []) as TrustpilotReview[];
        const legacyRevs = report.trustpilotReviews ?? [];
        const hasStructured = goodRevs.length > 0 || badRevs.length > 0;
        const hasAny = hasStructured || legacyRevs.length > 0;
        if (!hasAny) return null;

        const r = report.trustpilotRating!;

        // Verdict logic
        const allText = hasStructured
          ? [...goodRevs, ...badRevs].map(rv => rv.content).join(" ").toLowerCase()
          : legacyRevs.join(" ").toLowerCase();

        const themes: string[] = [];
        if (/not delivered|never arrived|still waiting|hasn't arrived|late deliver|slow ship|weeks to arrive|month.*wait/.test(allText))
          themes.push("slow or missing deliveries");
        if (/poor quality|bad quality|cheap|broke|defective|fake|not as described|wrong item|low quality|terrible product/.test(allText))
          themes.push("poor product quality");
        if (/hidden.*sub|subscription|charged.*again|bank.*charged|keeps.*charging|unauthorized/.test(allText))
          themes.push("unexpected charges or hidden subscriptions");
        if (/no response|doesn.*reply|ignore|terrible support|bad.*service|worst.*service|no.*support|never.*contact/.test(allText))
          themes.push("unresponsive customer support");
        if (/won.*refund|refus.*refund|no refund|hard.*return|difficult.*return/.test(allText))
          themes.push("difficulty getting refunds");

        const posWords = (allText.match(/amazing|excellent|great|love|recommend|happy|satisfied|fast|quick|perfect|wonderful|helpful|best/g) ?? []).length;
        const negWords = (allText.match(/terrible|awful|worst|bad|broken|never|don.t recommend|waste|disapoint|useless/g) ?? []).length;

        const isPositive = r >= 4.2 && posWords >= negWords && themes.length === 0;
        const isNegative = r < 3.0 || themes.length >= 2 || negWords > posWords;

        let verdictLabel: string;
        let vColor: string, vBg: string, vBorder: string;
        const aiReviewSummary = (report as unknown as { reviewSummary?: string }).reviewSummary;
        let summary: string, advice: string;

        if (isPositive) {
          summary      = aiReviewSummary || "Customers consistently report positive experiences — fast shipping, good product quality, and helpful support are frequently mentioned.";
          advice       = "This store looks reliable. You can proceed with confidence, but always keep your order confirmation just in case.";
          verdictLabel = "Safe to buy";
          vColor = "#4ade80"; vBg = "rgba(34,197,94,0.07)"; vBorder = "rgba(34,197,94,0.2)";
        } else if (themes.length > 0 && isNegative) {
          summary      = aiReviewSummary || `Reviewers frequently complain about: ${themes.join(", ")}.`;
          advice       = "Think twice before purchasing here — explore alternative stores first. If you proceed, use PayPal or a credit card so you can dispute charges if needed.";
          verdictLabel = "High risk";
          vColor = "#f87171"; vBg = "rgba(239,68,68,0.07)"; vBorder = "rgba(239,68,68,0.2)";
        } else if (themes.length > 0) {
          summary      = aiReviewSummary || `Reviewers frequently complain about: ${themes.join(", ")}.`;
          advice       = "Proceed with caution — check the return policy before ordering and use a payment method that allows disputes.";
          verdictLabel = "Use caution";
          vColor = "#fbbf24"; vBg = "rgba(251,191,36,0.07)"; vBorder = "rgba(251,191,36,0.2)";
        } else if (isNegative) {
          summary      = aiReviewSummary || "The majority of reviews are negative, with customers reporting bad experiences overall.";
          advice       = "We recommend avoiding this store or exploring alternatives before making a purchase.";
          verdictLabel = "Not recommended";
          vColor = "#f87171"; vBg = "rgba(239,68,68,0.07)"; vBorder = "rgba(239,68,68,0.2)";
        } else {
          summary      = aiReviewSummary || "Reviews are mixed — some customers are satisfied while others report issues.";
          advice       = "Read the most recent reviews carefully and use a payment method with buyer protection.";
          verdictLabel = "Mixed reviews";
          vColor = "#fbbf24"; vBg = "rgba(251,191,36,0.07)"; vBorder = "rgba(251,191,36,0.2)";
        }

        // Star renderer for individual reviews
        const ReviewStars = ({ count }: { count: number }) => (
          <div className="flex gap-px">
            {[1, 2, 3, 4, 5].map(s => {
              const color = count >= 4 ? "#00b67a" : count >= 3 ? "#fbbf24" : count >= 2 ? "#f97316" : "#ef4444";
              return (
                <Star key={s} className="h-2.5 w-2.5"
                  style={{ color: s <= count ? color : "rgba(255,255,255,0.1)", fill: s <= count ? color : "transparent" }} />
              );
            })}
          </div>
        );

        // Single review card
        const ReviewCard = ({ rev }: { rev: TrustpilotReview }) => (
          <div className="rounded-xl px-3.5 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <ReviewStars count={rev.rating} />
                <span className="text-[11px] font-medium text-gray-300">{rev.author}</span>
              </div>
              {rev.date !== "Unknown" && (
                <span className="text-[10px] text-gray-600">{rev.date}</span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">&ldquo;{rev.content}&rdquo;</p>
          </div>
        );

        return (
          <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>

            {/* ── Structured: Good + Bad in scrollable container ── */}
            {hasStructured ? (
              <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                {goodRevs.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 sticky top-0 py-1 z-10"
                      style={{ color: "#4ade80", background: "rgba(10,10,20,0.95)", backdropFilter: "blur(4px)" }}>
                      Positive reviews ({goodRevs.length})
                    </p>
                    <div className="space-y-2">
                      {goodRevs.slice(0, 5).map((rev, i) => <ReviewCard key={`g${i}`} rev={rev} />)}
                    </div>
                  </div>
                )}
                {badRevs.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 sticky top-0 py-1 z-10"
                      style={{ color: "#f87171", background: "rgba(10,10,20,0.95)", backdropFilter: "blur(4px)" }}>
                      Negative reviews ({badRevs.length})
                    </p>
                    <div className="space-y-2">
                      {badRevs.slice(0, 5).map((rev, i) => <ReviewCard key={`b${i}`} rev={rev} />)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Legacy flat snippets fallback */
              <div className="max-h-[320px] overflow-y-auto pr-1 mb-4"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-3">What customers say</p>
                <div className="space-y-2">
                  {legacyRevs.slice(0, 10).map((rev, i) => (
                    <div key={i} className="rounded-xl px-3.5 py-2.5"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs text-gray-400 leading-relaxed">&ldquo;{rev}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verdict card */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${vBorder}` }}>
              <div className="px-3.5 py-2 flex items-center gap-2" style={{ background: vBg }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: vColor }}>{verdictLabel}</span>
              </div>
              <div className="px-3.5 py-3" style={{ background: "rgba(255,255,255,0.015)" }}>
                <p className="text-xs font-medium leading-relaxed mb-1.5" style={{ color: vColor }}>{summary}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{advice}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
}
