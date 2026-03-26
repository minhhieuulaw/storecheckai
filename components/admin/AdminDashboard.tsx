"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, BarChart2, FileText, DollarSign, Shield, AlertTriangle,
  TrendingUp, UserCheck, UserX, Settings, ExternalLink, RefreshCw,
  WrenchIcon, Clock, MessageCircle,
} from "lucide-react";
import type { AdminStats, MaintenanceSettings } from "@/lib/admin";
import { MaintenancePanel } from "./MaintenancePanel";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString(); }
function fmtMoney(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function planColor(plan: string) {
  if (plan === "pro")      return "#c084fc";
  if (plan === "personal") return "#818cf8";
  if (plan === "starter")  return "#34d399";
  return "#6b7280";
}
function planLabel(plan: string) {
  return { free: "Free", starter: "Starter", personal: "Personal", pro: "Pro" }[plan] ?? plan;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color, href,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: string; href?: string;
}) {
  const inner = (
    <div className="rounded-2xl p-5 h-full flex flex-col justify-between gap-3 transition-all"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="flex items-start justify-between">
        <div className="rounded-xl p-2.5" style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {href && <ExternalLink className="h-3.5 w-3.5 text-gray-600" />}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{typeof value === "number" ? fmt(value) : value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-gray-700 mt-1">{sub}</div>}
      </div>
    </div>
  );
  if (href) return <a href={href} className="block h-full">{inner}</a>;
  return <div className="h-full">{inner}</div>;
}

// ── Recent user row ───────────────────────────────────────────────────────────
function UserRow({ user }: { user: AdminStats["recentUsers"][0] }) {
  const color = planColor(user.plan);
  const date  = new Date(user.createdAt).toLocaleDateString();
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
        style={{ background: `${color}18`, color }}>
        {user.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{user.name}</p>
        <p className="text-xs text-gray-600 truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
          {planLabel(user.plan)}
        </span>
        {user.isBanned && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
            Banned
          </span>
        )}
        <span className="text-xs text-gray-700">{date}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AdminDashboard({ stats, maintenance }: {
  stats: AdminStats;
  maintenance: MaintenanceSettings;
}) {
  const [showMaintenance, setShowMaintenance] = useState(false);

  const planEntries = Object.entries(stats.byPlan)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-400">StorecheckAI</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
              Admin
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMaintenance(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: maintenance.enabled ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.04)",
              border: maintenance.enabled ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: maintenance.enabled ? "#fbbf24" : "#9ca3af",
            }}>
            <WrenchIcon className="h-4 w-4" />
            {maintenance.enabled ? "Maintenance ON" : "Maintenance"}
          </button>
          <a href="/admin/users"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Users className="h-4 w-4" />
            Manage Users
          </a>
          <a href="/admin/tickets"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <MessageCircle className="h-4 w-4" />
            Tickets
          </a>
          <a href="/admin/scam-reports"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:text-white"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Scam Reports
          </a>
          <a href="/"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <ExternalLink className="h-4 w-4" />
            Site
          </a>
        </div>
      </div>

      {/* Maintenance banner if active */}
      {maintenance.enabled && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 mb-6 flex items-center gap-3"
          style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)" }}>
          <WrenchIcon className="h-4 w-4 shrink-0" style={{ color: "#fbbf24" }} />
          <div className="flex-1">
            <span className="text-sm font-semibold" style={{ color: "#fbbf24" }}>Maintenance mode is active. </span>
            <span className="text-sm text-gray-400">{maintenance.message}</span>
          </div>
          {maintenance.endsAt && (
            <div className="flex items-center gap-1 text-xs text-yellow-600 shrink-0">
              <Clock className="h-3.5 w-3.5" />
              Until {new Date(maintenance.endsAt).toLocaleString()}
            </div>
          )}
        </motion.div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}      label="Total Users"      value={stats.totalUsers}      color="#818cf8"
          sub={`+${stats.usersToday} today`} href="/admin/users" />
        <StatCard icon={TrendingUp} label="New This Month"   value={stats.usersThisMonth}  color="#34d399"
          sub={`+${stats.usersThisWeek} this week`} />
        <StatCard icon={FileText}   label="Total Reports"    value={stats.totalReports}     color="#38bdf8"
          sub={`${stats.reportsToday} today`} />
        <StatCard icon={DollarSign} label="Est. MRR"         value={fmtMoney(stats.estimatedMRR)} color="#c084fc"
          sub="Personal + Pro subscriptions" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard icon={UserCheck}  label="Paid Users"       value={(stats.byPlan.personal ?? 0) + (stats.byPlan.pro ?? 0)} color="#4ade80" />
        <StatCard icon={UserX}      label="Banned Users"     value={stats.bannedUsers}     color="#f87171" />
        <StatCard icon={BarChart2}  label="Free Users"       value={stats.byPlan.free ?? 0} color="#6b7280" />
        <StatCard icon={AlertTriangle} label="Starter (Pay/Check)" value={stats.byPlan.starter ?? 0} color="#fbbf24" />
      </div>

      {/* Plans breakdown + Recent users */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Plan distribution */}
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-200">Users by Plan</h2>
          </div>
          <div className="space-y-3">
            {planEntries.map(([plan, cnt]) => {
              const pct = stats.totalUsers > 0 ? Math.round((cnt / stats.totalUsers) * 100) : 0;
              const color = planColor(plan);
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{planLabel(plan)}</span>
                    <span className="text-sm font-semibold" style={{ color }}>{cnt} <span className="text-gray-600">({pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-gray-200">Recent Sign-ups</h2>
            </div>
            <a href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View all →
            </a>
          </div>
          <div>
            {stats.recentUsers.slice(0, 10).map(u => (
              <UserRow key={u.id} user={u} />
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">No users yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance modal */}
      {showMaintenance && (
        <MaintenancePanel
          initial={maintenance}
          onClose={() => setShowMaintenance(false)}
          onSave={() => { setShowMaintenance(false); window.location.reload(); }}
        />
      )}
    </div>
  );
}
