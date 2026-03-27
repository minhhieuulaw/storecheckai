import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession, getServerUser } from "@/lib/server-auth";
import { getUserReports, calcEstimatedSavings } from "@/lib/store";
import { QuickAnalyze } from "@/components/dashboard/QuickAnalyze";
import { VerifyEmailBanner } from "@/components/dashboard/VerifyEmailBanner";
import { BarChart3, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Clock, Zap, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Verdict } from "@/lib/types";

function verdictIcon(v: Verdict) {
  if (v === "BUY") return <CheckCircle2 className="h-4 w-4 text-green-400" />;
  if (v === "CAUTION") return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
  return <XCircle className="h-4 w-4 text-red-400" />;
}
function verdictColor(v: Verdict) {
  if (v === "BUY") return "text-green-400";
  if (v === "CAUTION") return "text-yellow-400";
  return "text-red-400";
}
function scoreColor(s: number) {
  if (s >= 70) return "#4ade80";
  if (s >= 45) return "#facc15";
  return "#f87171";
}

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: "Free trial",  color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
  starter:  { label: "Starter",     color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  personal: { label: "Personal",    color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  pro:      { label: "Pro",         color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
};

export default async function DashboardPage(
  { searchParams }: { searchParams: Promise<{ verify?: string }> },
) {
  const session = await getServerSession();
  if (!session) redirect("/login?from=/dashboard");

  const user = await getServerUser();
  if (!user) redirect("/login?from=/dashboard");

  const params = await searchParams;
  const verifyStatus = params.verify; // 'success' | 'expired' | 'invalid' | 'error'

  const reports = await getUserReports(user.id);
  const recent  = reports.slice(0, 5);

  const buyCount     = reports.filter(r => r.verdict === "BUY").length;
  const cautionCount = reports.filter(r => r.verdict === "CAUTION").length;
  const skipCount    = reports.filter(r => r.verdict === "SKIP").length;
  const flagged      = reports.filter(r => r.verdict === "SKIP" || (r.verdict === "CAUTION" && r.trustScore < 40))
                               .sort((a, b) => a.trustScore - b.trustScore)
                               .slice(0, 5);

  const stats = [
    { label: "Total Checks",  value: reports.length, icon: BarChart3,     color: "#818cf8" },
    { label: "Safe Stores",   value: buyCount,        icon: CheckCircle2,  color: "#4ade80" },
    { label: "Caution",       value: cautionCount,    icon: AlertTriangle, color: "#facc15" },
    { label: "Avoid",         value: skipCount,       icon: XCircle,       color: "#f87171" },
  ];

  const savings = calcEstimatedSavings(reports);

  const firstName        = user.name.split(" ")[0];
  const planInfo         = PLAN_LABELS[user.plan] ?? PLAN_LABELS.free;
  const checks           = user.checksRemaining;
  const needsVerification = !user.emailVerified;
  // Don't show "out of checks" upgrade banner for unverified users (they just need to verify)
  const isOut      = checks === 0 && !needsVerification;
  const isLow      = checks > 0 && checks <= 2;
  const checksColor = isOut ? "#f87171" : isLow ? "#fb923c" : "#e5e7eb";
  const checksBg    = isOut ? "rgba(239,68,68,0.08)"  : isLow ? "rgba(251,146,60,0.08)" : "rgba(255,255,255,0.04)";
  const checksBorder = isOut ? "rgba(239,68,68,0.3)"  : isLow ? "rgba(251,146,60,0.25)" : "rgba(255,255,255,0.09)";

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s an overview of your store checks.</p>
        </div>
        {/* Plan + quota — unified card */}
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

          {/* Plan pill */}
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
            style={{ background: planInfo.bg }}>
            <Zap className="h-3 w-3" style={{ color: planInfo.color }} />
            <span className="text-xs font-bold" style={{ color: planInfo.color }}>{planInfo.label}</span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Checks count */}
          <div className="flex items-center gap-1.5">
            {isOut
              ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: checksColor }} />
              : <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: checksColor }} />}
            <span className="text-sm font-bold" style={{ color: checksColor }}>{checks}</span>
            <span className="text-xs text-gray-500">checks left</span>
          </div>

          {/* Upgrade CTA */}
          {(isOut || isLow) && (
            <Link href="/dashboard/billing"
              className="ml-2 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white transition-all hover:opacity-90 shrink-0"
              style={{ background: isOut ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#f97316,#ea580c)" }}>
              {isOut ? "Upgrade" : "Top up"}
            </Link>
          )}
        </div>
      </div>

      {/* Email verification banner */}
      {needsVerification && verifyStatus !== "success" && (
        <VerifyEmailBanner />
      )}
      {verifyStatus === "success" && (
        <VerifyEmailBanner verifySuccess />
      )}

      {/* Out of checks banner */}
      {isOut && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.22)" }}>
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300 flex-1 min-w-0">
            You&apos;ve run out of checks.{" "}
            <span className="text-gray-400">Upgrade to keep analyzing.</span>
          </p>
          <Link href="/dashboard/billing"
            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            Upgrade
          </Link>
        </div>
      )}
      {isLow && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4"
          style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.2)" }}>
          <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
          <p className="text-sm text-orange-300 flex-1 min-w-0">
            Only {checks} check{checks > 1 ? "s" : ""} remaining.{" "}
            <span className="text-gray-400">Top up to keep going.</span>
          </p>
          <Link href="/dashboard/billing"
            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            Top up
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-3 sm:p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{label}</span>
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Estimated savings block */}
      {savings.flaggedCount > 0 && (
        <div className="mb-6 sm:mb-8 rounded-2xl px-4 py-4 sm:px-6 sm:py-5"
          style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.18)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl shrink-0"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-emerald-600 uppercase tracking-wider mb-0.5">
                Estimated loss avoided
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 leading-none">
                ${savings.totalUsd.toLocaleString("en-US")}
              </p>
            </div>
            <p className="hidden sm:block text-xs text-gray-600 max-w-xs leading-relaxed text-right">
              Based on {savings.flaggedCount} flagged store{savings.flaggedCount > 1 ? "s" : ""}.<br />
              Conservative estimate using actual prices,<br />
              otherwise median ($74/incident).
            </p>
          </div>
          {/* Mobile-only compact description */}
          <p className="sm:hidden mt-2 text-[11px] text-gray-600 leading-relaxed">
            Based on {savings.flaggedCount} flagged store{savings.flaggedCount > 1 ? "s" : ""} · median $74/incident
          </p>
        </div>
      )}

      {/* Quick analyze */}
      <div className="mb-8">
        <QuickAnalyze checksRemaining={user.checksRemaining} />
      </div>

      {/* Flagged / Alarming stores */}
      {flagged.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Stores to Avoid</h2>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                {flagged.length}
              </span>
            </div>
            <Link href="/dashboard/report-scam"
              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
              Report a scam <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {flagged.map(r => (
              <Link key={r.id} href={`/report/${r.id}`}>
                <div className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-red-500/[0.04] cursor-pointer"
                  style={{ border: "1px solid rgba(239,68,68,0.14)", background: "rgba(239,68,68,0.03)" }}>
                  <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                    {r.domain.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.storeName}</p>
                    <p className="text-xs text-gray-600 truncate">{r.domain}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-red-400">{r.trustScore}</span>
                    <div className="flex items-center gap-1 text-xs font-medium text-red-400">
                      <XCircle className="h-3.5 w-3.5" />
                      {r.verdict}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Reports</h2>
          {reports.length > 5 && (
            <Link href="/dashboard/reports" className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <BarChart3 className="h-8 w-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No reports yet. Analyze your first store above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(r => (
              <Link key={r.id} href={`/report/${r.id}`}>
                <div className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.03] cursor-pointer"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  {r.ogImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.ogImage} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                  ) : (
                    <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-gray-600"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {r.domain.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.storeName}</p>
                    <p className="text-xs text-gray-600 truncate">{r.domain}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold" style={{ color: scoreColor(r.trustScore) }}>{r.trustScore}</span>
                    <div className={`flex items-center gap-1 text-xs font-medium ${verdictColor(r.verdict)}`}>
                      {verdictIcon(r.verdict)}
                      {r.verdict}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      {new Date(r.analyzedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
