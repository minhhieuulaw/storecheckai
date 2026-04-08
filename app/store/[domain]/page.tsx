import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getPublicStoreByDomain } from "@/lib/public-data";
import { ShieldCheck, ShieldAlert, ShieldX, ArrowRight, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain } = await params;
  const store = await getPublicStoreByDomain(domain);
  if (!store) return { title: "Store Not Found — StorecheckAI" };

  const verdictText = store.verdict === "BUY" ? "Safe to buy" : store.verdict === "CAUTION" ? "Use caution" : "Not recommended";

  return {
    title: `Is ${store.domain} legit? ${verdictText} — StorecheckAI`,
    description: `${store.storeName} (${store.domain}) has a trust score of ${store.trustScore}/100. ${store.verdictReason}`,
    openGraph: {
      title: `Is ${store.domain} safe? Trust Score: ${store.trustScore}/100`,
      description: store.verdictReason || `AI safety analysis for ${store.domain}`,
    },
  };
}

function scoreColor(s: number) {
  if (s >= 65) return "#4ade80";
  if (s >= 40) return "#fbbf24";
  return "#f87171";
}

function verdictConfig(v: string) {
  if (v === "BUY") return { color: "#4ade80", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.15)", label: "Safe to Buy", icon: ShieldCheck, desc: "This store shows strong trust signals." };
  if (v === "CAUTION") return { color: "#fbbf24", bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.15)", label: "Use Caution", icon: ShieldAlert, desc: "This store has some concerning signals." };
  return { color: "#f87171", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)", label: "Not Recommended", icon: ShieldX, desc: "This store has significant trust issues." };
}

export default async function StorePage({ params }: PageProps) {
  const { domain } = await params;
  const store = await getPublicStoreByDomain(domain);
  if (!store) notFound();

  const vc = verdictConfig(store.verdict);
  const VerdictIcon = vc.icon;
  const analyzedDate = new Date(store.analyzedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-8">
          <Link href="/database" className="hover:text-gray-300 transition-colors">Database</Link>
          <span>/</span>
          <span className="text-gray-400">{store.domain}</span>
        </div>

        {/* Store header */}
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: vc.bg, border: `1px solid ${vc.border}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{store.storeName}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {store.domain}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                  style={{ background: vc.bg, color: vc.color, border: `1px solid ${vc.border}` }}>
                  <VerdictIcon className="h-4 w-4" />
                  {vc.label}
                </span>
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Analyzed {analyzedDate}
                </span>
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: "rgba(0,0,0,0.3)", color: scoreColor(store.trustScore), border: `2px solid ${scoreColor(store.trustScore)}30` }}>
                {store.trustScore}
              </div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mt-1">Trust Score</p>
            </div>
          </div>

          {store.verdictReason && (
            <p className="text-sm text-gray-300 mt-4 leading-relaxed">{store.verdictReason}</p>
          )}
        </div>

        {/* Community warning */}
        {store.communityReportCount > 0 && (
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <p className="text-sm font-semibold text-red-300">
                {store.communityReportCount} community report{store.communityReportCount > 1 ? "s" : ""} flagged this store
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Users have submitted evidence that this store may be unsafe.</p>
          </div>
        )}

        {/* Pros & Cons */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {store.pros.length > 0 && (
            <div className="rounded-xl p-5"
              style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-green-400/80 mb-3">What this store does well</p>
              <ul className="space-y-2">
                {store.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {store.cons.length > 0 && (
            <div className="rounded-xl p-5"
              style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-red-400/80 mb-3">Watch out for</p>
              <ul className="space-y-2">
                {store.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Red flags */}
        {store.redFlags.length > 0 && (
          <div className="rounded-xl p-5 mb-6"
            style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.08)" }}>
            <p className="text-xs font-bold uppercase tracking-wider text-red-400/80 mb-3">Red Flags</p>
            <div className="flex flex-wrap gap-2">
              {store.redFlags.map((f, i) => (
                <span key={i} className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)", color: "#fca5a5" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl p-6 text-center"
          style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <p className="text-sm text-gray-300 mb-1">Want the full safety report?</p>
          <p className="text-xs text-gray-600 mb-4">Includes price comparison, return risk analysis, Trustpilot reviews, and more.</p>
          <Link href={`/report/${store.reportId}`}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            View Full Report <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* SEO content — targets "is [domain] legit" queries */}
        <div className="mt-12 space-y-4 text-sm text-gray-600 leading-relaxed">
          <h2 className="text-lg font-semibold text-white">Is {store.domain} legit?</h2>
          <p>
            Based on our AI analysis of {store.domain}, this store received a trust score of{" "}
            <strong className="text-white">{store.trustScore} out of 100</strong> and a verdict of{" "}
            <strong style={{ color: vc.color }}>{vc.label}</strong>.
            {store.verdict === "BUY" && " Our analysis indicates this store demonstrates reliable trust signals for online shopping."}
            {store.verdict === "CAUTION" && " While some trust signals are present, we recommend proceeding with caution and using a secure payment method."}
            {store.verdict === "SKIP" && " We do not recommend purchasing from this store based on the trust signals we analyzed."}
          </p>
          <p>
            This analysis was performed on {analyzedDate} and evaluates over 20 trust signals including
            domain age, SSL security, return policies, contact information, Trustpilot reviews, payment methods,
            and potential dark patterns. The store has been checked {store.checkCount} time{store.checkCount > 1 ? "s" : ""} by StorecheckAI users.
          </p>
          <p className="text-xs text-gray-700">
            Disclaimer: This analysis is AI-generated and informational only. It is not financial or legal advice.
            Always use your own judgment when making online purchases.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
