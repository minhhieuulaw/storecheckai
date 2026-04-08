import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getPublicStores, getDatabaseStats } from "@/lib/public-data";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Search, ArrowRight, Database } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store Safety Database — StorecheckAI",
  description: "Browse our database of AI-analyzed online stores. Check trust scores, verdicts, and safety reports before you shop.",
  openGraph: {
    title: "Store Safety Database — StorecheckAI",
    description: "Browse AI-analyzed store safety reports. Find out which stores are safe to buy from.",
  },
};

function verdictStyle(v: string) {
  if (v === "BUY") return { color: "#4ade80", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.18)", label: "Safe", icon: ShieldCheck };
  if (v === "CAUTION") return { color: "#fbbf24", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.18)", label: "Caution", icon: ShieldAlert };
  return { color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)", label: "Risky", icon: ShieldX };
}

function scoreColor(s: number) {
  if (s >= 65) return "#4ade80";
  if (s >= 40) return "#fbbf24";
  return "#f87171";
}

export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ verdict?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const verdict = params.verdict || "";
  const sort = (params.sort || "newest") as "newest" | "lowest" | "highest";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const [{ stores, total }, stats] = await Promise.all([
    getPublicStores({ page, pageSize: 24, verdict: verdict || undefined, sort }),
    getDatabaseStats(),
  ]);

  const totalPages = Math.ceil(total / 24);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-24">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Database className="h-6 w-6 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white">Store Safety Database</h1>
          </div>
          <p className="text-gray-500 max-w-xl mx-auto">
            Browse {stats.totalStores.toLocaleString()} AI-analyzed online stores. Every store is scored on 20+ trust signals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Analyzed", value: stats.totalStores, color: "#818cf8" },
            { label: "Safe Stores", value: stats.safeStores, color: "#4ade80" },
            { label: "Use Caution", value: stats.cautionStores, color: "#fbbf24" },
            { label: "Risky Stores", value: stats.riskyStores, color: "#f87171" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
              <p className="text-[11px] text-gray-600 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex items-center gap-1 mr-2">
            <Search className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs text-gray-600">Filter:</span>
          </div>
          {[
            { label: "All", value: "" },
            { label: "Safe", value: "BUY" },
            { label: "Caution", value: "CAUTION" },
            { label: "Risky", value: "SKIP" },
          ].map(f => (
            <Link key={f.value}
              href={`/database?verdict=${f.value}&sort=${sort}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${verdict === f.value ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
              style={{
                background: verdict === f.value ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${verdict === f.value ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
              }}>
              {f.label}
            </Link>
          ))}

          <div className="ml-auto flex gap-1">
            {[
              { label: "Newest", value: "newest" },
              { label: "Lowest", value: "lowest" },
              { label: "Highest", value: "highest" },
            ].map(s => (
              <Link key={s.value}
                href={`/database?verdict=${verdict}&sort=${s.value}`}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${sort === s.value ? "text-white" : "text-gray-600 hover:text-gray-300"}`}
                style={{
                  background: sort === s.value ? "rgba(255,255,255,0.08)" : "transparent",
                }}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Store grid */}
        {stores.length === 0 ? (
          <div className="rounded-2xl p-16 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Shield className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No stores found matching this filter.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map(store => {
              const vs = verdictStyle(store.verdict);
              const Icon = vs.icon;
              return (
                <Link key={store.domain} href={`/store/${store.domain}`}>
                  <div className="group rounded-xl p-4 transition-all hover:scale-[1.01] cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${vs.border}` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {store.storeName}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{store.domain}</p>
                      </div>
                      <div className="shrink-0 ml-3 text-right">
                        <p className="text-lg font-bold" style={{ color: scoreColor(store.trustScore) }}>
                          {store.trustScore}
                        </p>
                        <p className="text-[9px] text-gray-700 uppercase">trust</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: vs.bg, color: vs.color, border: `1px solid ${vs.border}` }}>
                        <Icon className="h-3 w-3" />
                        {vs.label}
                      </span>
                      <span className="text-[10px] text-gray-700">
                        {store.checkCount} check{store.checkCount > 1 ? "s" : ""} · {new Date(store.analyzedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link href={`/database?verdict=${verdict}&sort=${sort}&page=${page - 1}`}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                Previous
              </Link>
            )}
            <span className="text-xs text-gray-600">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/database?verdict=${verdict}&sort=${sort}&page=${page + 1}`}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                Next
              </Link>
            )}
          </div>
        )}

        {/* SEO content */}
        <div className="mt-16 rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-lg font-semibold text-white mb-3">About This Database</h2>
          <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
            <p>
              StorecheckAI maintains a growing database of online stores analyzed by our AI safety engine.
              Each store is evaluated against 20+ trust signals including domain age, SSL security, return policies,
              Trustpilot reviews, payment methods, and more.
            </p>
            <p>
              Looking for a specific store? Use our analyzer to check any URL instantly.
              Every analysis generates a detailed safety report with a trust score, verdict, and actionable recommendations.
            </p>
            <p>
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1">
                Check a store now <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
