import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession, getServerUser } from "@/lib/server-auth";
import { getUserReports } from "@/lib/store";
import { QuickAnalyze } from "@/components/dashboard/QuickAnalyze";
import { BarChart3, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Clock, Zap } from "lucide-react";
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

  const buyCount    = reports.filter(r => r.verdict === "BUY").length;
  const cautionCount = reports.filter(r => r.verdict === "CAUTION").length;
  const skipCount   = reports.filter(r => r.verdict === "SKIP").length;

  const stats = [
    { label: "Total Checks",  value: reports.length, icon: BarChart3,     color: "#818cf8" },
    { label: "Safe Stores",   value: buyCount,        icon: CheckCircle2,  color: "#4ade80" },
    { label: "Caution",       value: cautionCount,    icon: AlertTriangle, color: "#facc15" },
    { label: "Avoid",         value: skipCount,       icon: XCircle,       color: "#f87171" },
  ];

  const firstName  = user.name.split(" ")[0];
  const planInfo   = PLAN_LABELS[user.plan] ?? PLAN_LABELS.free;
  const isLowQuota = user.checksRemaining <= 2;

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
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
          <div className="flex items-center gap-1.5 rounded-xl px-3 py-2"
            style={{
              background: isLowQuota ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)",
              border: isLowQuota ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(255,255,255,0.07)",
            }}>
            <span className="text-sm font-bold" style={{ color: isLowQuota ? "#f87171" : "#e5e7eb" }}>
              {user.checksRemaining}
            </span>
            <span className="text-xs text-gray-500">checks left</span>
          </div>
        </div>
      </div>

      {/* Low quota warning */}
      {isLowQuota && (
        <div className="mb-6 flex items-center justify-between rounded-2xl px-5 py-4"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              {user.checksRemaining === 0 ? "You've run out of checks." : `Only ${user.checksRemaining} check${user.checksRemaining > 1 ? "s" : ""} remaining.`}{" "}
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
