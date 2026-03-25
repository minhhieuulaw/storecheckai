"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle, Clock, CheckCheck, XCircle,
  ChevronDown, ChevronUp, Send, Loader2,
  RefreshCw, Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Ticket {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  admin_reply: string | null;
  admin_replied_at: string | null;
  created_at: string;
  updated_at: string;
}

function StatusBadge({ status }: { status: Ticket["status"] }) {
  const map = {
    open:    { label: "Open",    color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: Clock },
    replied: { label: "Replied", color: "#4ade80", bg: "rgba(74,222,128,0.12)",  icon: CheckCheck },
    closed:  { label: "Closed",  color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: XCircle },
  };
  const { label, color, bg, icon: Icon } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color, background: bg }}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function TicketRow({ ticket, onAction }: { ticket: Ticket; onAction: () => void }) {
  const [open, setOpen] = useState(ticket.status === "open");
  const [reply, setReply] = useState(ticket.admin_reply ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function doAction(action: string) {
    setErr("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reply: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Failed."); return; }
      onAction();
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
      {/* Header row */}
      <button
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <StatusBadge status={ticket.status} />
            <span className="text-[11px] text-gray-500">{ticket.user_email}</span>
            <span className="text-[11px] text-gray-700">
              {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5 line-clamp-1">{ticket.message}</p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-gray-600 shrink-0 mt-1" />
          : <ChevronDown className="h-4 w-4 text-gray-600 shrink-0 mt-1" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {/* User info */}
              <div className="pt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  {ticket.user_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{ticket.user_name}</p>
                  <p className="text-[11px] text-gray-500">{ticket.user_email}</p>
                </div>
              </div>

              {/* Message */}
              <div className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Message</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
              </div>

              {/* Existing reply */}
              {ticket.admin_reply && (
                <div className="rounded-xl p-4"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Previous Reply</p>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{ticket.admin_reply}</p>
                </div>
              )}

              {/* Reply box — only if not closed */}
              {ticket.status !== "closed" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {ticket.admin_reply ? "Update reply" : "Write reply"}
                  </label>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={4}
                    placeholder="Type your reply…"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none resize-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
              )}

              {err && (
                <p className="text-xs text-red-400 rounded-lg px-3 py-2"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {err}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {ticket.status !== "closed" && (
                  <>
                    <button
                      onClick={() => doAction("reply")}
                      disabled={saving || !reply.trim()}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Send Reply
                    </button>
                    <button
                      onClick={() => doAction("close")}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-gray-400 hover:text-red-400 transition-colors"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                      <XCircle className="h-3.5 w-3.5" />
                      Close Ticket
                    </button>
                  </>
                )}
                {ticket.status === "closed" && (
                  <button
                    onClick={() => doAction("reopen")}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-gray-400 hover:text-green-400 transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reopen
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/tickets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCount    = tickets.filter(t => t.status === "open").length;
  const repliedCount = tickets.filter(t => t.status === "replied").length;

  const filters = [
    { value: "",        label: "All" },
    { value: "open",    label: "Open" },
    { value: "replied", label: "Replied" },
    { value: "closed",  label: "Closed" },
  ];

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} total · {openCount} open · {repliedCount} awaiting user response
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-6">
        <Filter className="h-3.5 w-3.5 text-gray-600 mr-1" />
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: statusFilter === f.value ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
              color:      statusFilter === f.value ? "#a5b4fc" : "#9ca3af",
              border:     `1px solid ${statusFilter === f.value ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <MessageCircle className="h-8 w-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No tickets found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <TicketRow key={t.id} ticket={t} onAction={load} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-gray-600">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl px-3 py-1.5 text-xs text-gray-400 disabled:opacity-30 transition-colors hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * PAGE_SIZE >= total}
              className="rounded-xl px-3 py-1.5 text-xs text-gray-400 disabled:opacity-30 transition-colors hover:text-white"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
