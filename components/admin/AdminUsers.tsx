"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Shield, ArrowLeft, UserX, UserCheck, Plus, Minus,
  ChevronLeft, ChevronRight, CheckCircle2, X, AlertTriangle,
} from "lucide-react";
import type { AdminUser } from "@/lib/admin";

// ── helpers ──────────────────────────────────────────────────────────────────
function planColor(plan: string) {
  if (plan === "pro")      return "#c084fc";
  if (plan === "personal") return "#818cf8";
  if (plan === "starter")  return "#34d399";
  return "#6b7280";
}
function planLabel(plan: string) {
  return { free: "Free", starter: "Starter", personal: "Personal", pro: "Pro" }[plan] ?? plan;
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Check adjustment modal ────────────────────────────────────────────────────
function AdjustChecksModal({ user, onClose, onDone }: {
  user: AdminUser;
  onClose: () => void;
  onDone: (newCount: number) => void;
}) {
  const [delta,   setDelta]   = useState<string>("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const parsed = parseInt(delta, 10);
  const isValid = !isNaN(parsed) && parsed !== 0;
  const isAdd   = parsed > 0;

  async function handleSubmit() {
    if (!isValid) return;
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/users/${user.id}/checks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: parsed }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error || "Failed"); return; }
    setSuccess(true);
    setTimeout(() => onDone(data.checksRemaining), 700);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: "#0c0c1a", border: "1px solid rgba(255,255,255,0.1)" }}>

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Adjust Checks</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="h-4 w-4" /></button>
        </div>

        <div className="rounded-2xl p-3 mb-4 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: `${planColor(user.plan)}18`, color: planColor(user.plan) }}>
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-white">{user.checksRemaining}</p>
            <p className="text-[10px] text-gray-600">checks left</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">
            Delta (positive to add, negative to remove)
          </label>
          <div className="flex gap-2">
            <button onClick={() => setDelta(d => String((parseInt(d) || 0) - 1))}
              className="rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={delta}
              onChange={e => setDelta(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2.5 text-center text-white text-lg font-bold outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              placeholder="0"
            />
            <button onClick={() => setDelta(d => String((parseInt(d) || 0) + 1))}
              className="rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {isValid && (
            <p className="mt-1.5 text-xs text-center"
              style={{ color: isAdd ? "#4ade80" : "#f87171" }}>
              {isAdd ? `+ ${parsed}` : `- ${Math.abs(parsed)}`} checks →{" "}
              <strong>{Math.max(0, user.checksRemaining + parsed)}</strong> remaining
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl p-3 mb-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!isValid || saving || success}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background: success ? "rgba(34,197,94,0.8)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {success ? <><CheckCircle2 className="h-4 w-4" /> Done!</> : saving ? "Saving…" : "Apply"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── User table row ────────────────────────────────────────────────────────────
function UserTableRow({ user, onAdjustChecks, onToggleBan }: {
  user: AdminUser;
  onAdjustChecks: (u: AdminUser) => void;
  onToggleBan: (u: AdminUser) => void;
}) {
  const color = planColor(user.plan);
  return (
    <tr className="border-b transition-colors hover:bg-white/[0.02]"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: `${color}18`, color }}>
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate max-w-[160px]">{user.name}</p>
            <p className="text-xs text-gray-500 truncate max-w-[160px]">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase"
          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
          {planLabel(user.plan)}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-bold" style={{ color: user.checksRemaining > 0 ? "#4ade80" : "#6b7280" }}>
          {user.checksRemaining}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-xs text-gray-500">{user.reportCount}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-gray-600">{fmtDate(user.createdAt)}</span>
      </td>
      <td className="py-3 px-4 text-center">
        {user.isBanned
          ? <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
              Banned
            </span>
          : <span className="text-xs text-gray-700">—</span>}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => onAdjustChecks(user)}
            title="Adjust checks"
            className="rounded-lg p-1.5 text-gray-500 hover:text-indigo-400 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onToggleBan(user)}
            title={user.isBanned ? "Unban user" : "Ban user"}
            className="rounded-lg p-1.5 transition-colors"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              color: user.isBanned ? "#4ade80" : "#f87171",
            }}>
            {user.isBanned ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AdminUsers({ users: initialUsers, total, search: initialSearch, page }: {
  users: AdminUser[];
  total: number;
  search: string;
  page: number;
}) {
  const router  = useRouter();
  const [isPending, startTransition] = useTransition();
  const [users,  setUsers]  = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState(initialSearch);
  const [adjustUser, setAdjustUser] = useState<AdminUser | null>(null);
  const [banUser,    setBanUser]    = useState<AdminUser | null>(null);
  const [banLoading, setBanLoading] = useState(false);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  function navigate(newSearch: string, newPage: number) {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newPage > 1) params.set("page", String(newPage));
    startTransition(() => {
      router.push(`/admin/users${params.toString() ? "?" + params.toString() : ""}`);
    });
  }

  async function handleBanConfirm() {
    if (!banUser) return;
    setBanLoading(true);
    const res = await fetch(`/api/admin/users/${banUser.id}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: !banUser.isBanned }),
    });
    const data = await res.json();
    setBanLoading(false);
    if (data.success) {
      setUsers(u => u.map(x => x.id === banUser.id ? { ...x, isBanned: data.isBanned } : x));
    }
    setBanUser(null);
  }

  function handleChecksUpdated(userId: string, newCount: number) {
    setUsers(u => u.map(x => x.id === userId ? { ...x, checksRemaining: newCount } : x));
    setAdjustUser(null);
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <a href="/admin"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </a>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">User Management</h1>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium text-gray-500"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          {total} total
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && navigate(search, 1)}
          placeholder="Search by name or email…"
          className="w-full rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-200 outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        {search && (
          <button
            onClick={() => { setSearch(""); navigate("", 1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden mb-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["User", "Plan", "Checks", "Reports", "Joined", "Status", ""].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <UserTableRow
                  key={u.id}
                  user={u}
                  onAdjustChecks={setAdjustUser}
                  onToggleBan={setBanUser}
                />
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-600">No users found</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Page {page} of {totalPages} · {total} users
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => navigate(search, page - 1)}
              className="rounded-xl p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-40"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => navigate(search, page + 1)}
              className="rounded-xl p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-40"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Adjust Checks Modal */}
      <AnimatePresence>
        {adjustUser && (
          <AdjustChecksModal
            user={adjustUser}
            onClose={() => setAdjustUser(null)}
            onDone={newCount => handleChecksUpdated(adjustUser.id, newCount)}
          />
        )}
      </AnimatePresence>

      {/* Ban Confirmation Modal */}
      <AnimatePresence>
        {banUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={e => e.target === e.currentTarget && setBanUser(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: "#0c0c1a", border: "1px solid rgba(255,255,255,0.1)" }}>

              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl p-2.5"
                  style={{
                    background: banUser.isBanned ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    border: banUser.isBanned ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.25)",
                  }}>
                  {banUser.isBanned
                    ? <UserCheck className="h-4 w-4" style={{ color: "#4ade80" }} />
                    : <UserX className="h-4 w-4" style={{ color: "#f87171" }} />}
                </div>
                <h3 className="text-base font-bold text-white">
                  {banUser.isBanned ? "Unban" : "Ban"} User
                </h3>
              </div>

              <p className="text-sm text-gray-400 mb-1">
                {banUser.isBanned
                  ? "This will restore full access to this account."
                  : "This will immediately block all access for this account."}
              </p>
              <p className="text-sm font-medium text-gray-200 mb-5 truncate">{banUser.name} ({banUser.email})</p>

              <div className="flex gap-2">
                <button onClick={() => setBanUser(null)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancel
                </button>
                <button onClick={handleBanConfirm} disabled={banLoading}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-70"
                  style={{
                    background: banUser.isBanned
                      ? "rgba(34,197,94,0.7)"
                      : "linear-gradient(135deg, #ef4444, #dc2626)",
                  }}>
                  {banLoading ? "Working…" : banUser.isBanned ? "Unban" : "Ban User"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
