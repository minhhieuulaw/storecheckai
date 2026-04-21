"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Report } from "@/lib/types";
import { ErrorState } from "@/components/report/common/ErrorState";
import { StoreHeroV2 } from "@/components/report/v2/StoreHeroV2";
import { VerdictBannerV2 } from "@/components/report/v2/VerdictBannerV2";
import { HealthSnapshotV2 } from "@/components/report/v2/HealthSnapshotV2";
import { TrustpilotV2 } from "@/components/report/v2/TrustpilotV2";
import { DropshipRiskV2 } from "@/components/report/v2/DropshipRiskV2";
import { LandedCostV2 } from "@/components/report/v2/LandedCostV2";
import { ProductIntelV2 } from "@/components/report/v2/ProductIntelV2";
import { PriceCheckV2 } from "@/components/report/v2/PriceCheckV2";

/**
 * Report V2 — Bento Executive Dashboard
 *
 * Parallel route for internal QA. Access via /report/:id/v2
 * Uses --v2-* design tokens from globals.css
 * Font: Geist (sans) + Fraunces (display serif via --v2-font-display)
 *
 * Status: Hero row complete. Remaining sections ship commit-by-commit.
 */
export default function ReportPageV2() {
  const params = useParams();
  const id = params?.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/report/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setReport(data as Report);
      })
      .catch(() => setError("Failed to load report."));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!report) return <LoadingStateV2 />;

  const isBasicPlan = report.planUsed === "starter" || report.planUsed === "free";

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--v2-bg)" }}
    >
      {/* Navbar */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "color-mix(in srgb, var(--v2-surface) 92%, transparent)",
          borderBottom: "1px solid var(--v2-border)",
          backdropFilter: "blur(16px)",
        }}
      >
        <span
          className="text-sm font-semibold"
          style={{
            color: "var(--v2-text)",
            fontFamily: "var(--v2-font-display)",
          }}
        >
          StorecheckAI
        </span>
        <span
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: "var(--v2-accent-glow)",
            color: "var(--v2-accent)",
            border: "1px solid var(--v2-accent)",
          }}
        >
          V2 Preview
        </span>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ── HERO BENTO ROW ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          <div className="md:col-span-5">
            <StoreHeroV2
              storeName={report.storeName}
              url={report.url}
              domain={report.domain}
              analyzedAt={report.analyzedAt}
            />
          </div>
          <div className="md:col-span-7">
            <VerdictBannerV2
              verdict={report.verdict}
              verdictReason={report.verdictReason}
              trustScore={report.trustScore}
            />
          </div>
        </div>

        {/* ── HEALTH SNAPSHOT ──────────────────────────────────────────── */}
        <div className="mb-4">
          <HealthSnapshotV2
            returnRisk={report.returnRisk}
            trustpilotRating={report.trustpilotRating}
            trustpilotReviewCount={report.trustpilotReviewCount}
            shippingOriginSignals={report.shippingOriginSignals ?? []}
            paymentMethods={report.paymentMethods ?? []}
          />
        </div>

        {/* ── TRUSTPILOT ───────────────────────────────────────────────── */}
        <div className="mb-4">
          <TrustpilotV2
            rating={report.trustpilotRating}
            reviewCount={report.trustpilotReviewCount}
            goodReviews={report.trustpilotGoodReviews ?? []}
            badReviews={report.trustpilotBadReviews ?? []}
            domain={report.domain}
          />
        </div>

        {/* ── DROPSHIP RISK ────────────────────────────────────────────── */}
        {(() => {
          const risk = (report as unknown as { dropshipRisk?: { markupScore: number; level: "low" | "medium" | "high" | "critical"; storePriceUsd: number | null; aliMedianPriceUsd: number | null; markupMultiplier: number | null; evidence: string[]; recommendation: string } }).dropshipRisk;
          if (!risk) return null;
          return (
            <div className="mb-4">
              <DropshipRiskV2 risk={risk} />
            </div>
          );
        })()}

        {/* ── LANDED COST ──────────────────────────────────────────────── */}
        {(() => {
          const cost = (report as unknown as { landedCost?: { productPriceUsd: number; estimatedShippingUsd: number; estimatedDutyUsd: number; totalUsd: number; shippingTimeText: string; afterSalesRisk: "low" | "medium" | "high"; note: string } }).landedCost;
          if (!cost) return null;
          return (
            <div className="mb-4">
              <LandedCostV2 cost={cost} />
            </div>
          );
        })()}

        {/* ── PRODUCT INTELLIGENCE ─────────────────────────────────────── */}
        {report.productIntel && report.productIntel.pageType !== "unknown" && (
          <div className="mb-4">
            <ProductIntelV2 intel={report.productIntel} />
          </div>
        )}

        {/* ── PRICE CHECK ──────────────────────────────────────────────── */}
        <div className="mb-4">
          <PriceCheckV2
            priceAnalysis={report.priceAnalysis ?? []}
            products={report.products ?? []}
            isBasicPlan={isBasicPlan}
          />
        </div>

        {/* TODO: Recommendations, Guidance, Technical, FB Ad, Footer */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: "var(--v2-text-dim)" }}
        >
          More sections coming. V1 route at <code style={{ color: "var(--v2-accent)" }}>/report/{id}</code> remains untouched.
        </p>
      </main>
    </div>
  );
}

function LoadingStateV2() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--v2-bg)" }}
    >
      <div
        className="rounded-2xl px-8 py-6"
        style={{
          background: "var(--v2-surface)",
          border: "1px solid var(--v2-border)",
          borderRadius: "var(--v2-radius-lg)",
        }}
      >
        <p
          className="text-sm"
          style={{ color: "var(--v2-text-secondary)" }}
        >
          Loading report…
        </p>
      </div>
    </div>
  );
}
