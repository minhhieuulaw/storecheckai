import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession, getServerUser } from "@/lib/server-auth";
import { getUserReports } from "@/lib/store";
import { QuickAnalyze } from "@/components/dashboard/QuickAnalyze";
import { BarChart3, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Clock, Zap, ShieldAlert } from "lucide-react";
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

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?from=/dashboard");

  const user = await getServerUser();
  if (!user) redirect("/login?from=/dashboard");

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

  const firstName  = user.name.split(" ")[0];
  const planInfo   = PLAN_LABELS[user.plan] ?? PLAN_LABELS.free;
  const checks     = user.checksRemaining;
  const isOut      = checks === 0;
  const isLow      = checks > 0 && checks <= 2;
  const checksColor = isOut ? "#f87171" : isLow ? "#fb923c" : "#e5e7eb";
  const checksBg    = isOut ? "rgba(239,68,68,0.08)"  : isLow ? "rgba(251,146,60,0.08)" : "rgba(255,255,255,0.04)";
  const checksBorder = isOut ? "rgba(239,68,68,0.3)"  : isLow ? "rgba(251,146,60,0.25)" : "rgba(255,255,255,0.09)";

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s an overview of your store checks.</p>
        </div>
        {/* Plan + quota badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: planInfo.bg, border: `1px solid ${planInfo.color}30` }}>
            <Zap className="h-3.5 w-3.5" style={{ color: planInfo.color }} />
            <span className="text-xs font-semibold" style={{ color: planInfo.color }}>{planInfo.label}</span>
          </div>

          {/* Checks remaining — prominent card */}
          <div className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
            style={{ background: checksBg, border: `1px solid ${checksBorder}` }}>
            {isOut ? (
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: checksColor }} />
            ) : (
              <Zap className="h-4 w-4 shrink-0" style={{ color: checksColor }} />
            )}
            <div className="flex flex-col leading-none">
              <span className="text-xl font-extrabold" style={{ color: checksColor }}>{checks}</span>
              <span className="text-[10px] text-gray-500 mt-0.5">checks left</span>
            </div>
            {(isOut || isLow) && (
              <Link href="/dashboard/billing"
                className="ml-1 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white transition-all hover:opacity-90 shrink-0"
                style={{ background: isOut ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#f97316,#ea580c)" }}>
                {isOut ? "Upgrade now" : "Top up"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Out of checks banner */}
      {isOut && (
        <div className="mb-6 flex items-center justify-between rounded-2xl px-5 py-4"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.22)" }}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">
              You&apos;ve run out of checks.{" "}
              <span className="text-gray-400">Upgrade your plan to keep analyzing stores.</span>
            </p>
          </div>
          <Link href="/dashboard/billing"
            className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            Upgrade now
          </Link>
        </div>
      )}
      {isLow && (
        <div className="mb-6 flex items-center justify-between rounded-2xl px-5 py-4"
          style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.2)" }}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-sm text-orange-300">
              Only {checks} check{checks > 1 ? "s" : ""} remaining.{" "}
              <span className="text-gray-400">Upgrade to keep analyzing stores.</span>
            </p>
          </div>
          <Link href="/dashboard/billing"
            className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            Upgrade
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

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
