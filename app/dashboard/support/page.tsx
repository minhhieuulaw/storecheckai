"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Send, ChevronDown, ChevronUp,
  Clock, CheckCheck, XCircle, RefreshCw, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  adminReply: string | null;
  adminRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function StatusBadge({ status }: { status: Ticket["status"] }) {
  const map = {
    open:    { label: "Open",    color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  icon: Clock },
    replied: { label: "Replied", color: "#4ade80", bg: "rgba(74,222,128,0.1)",  icon: CheckCheck },
    closed:  { label: "Closed",  color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: XCircle },
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

function TicketCard({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(ticket.status === "replied");

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
      {/* Header */}
      <button
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <StatusBadge status={ticket.status} />
            <span className="text-[11px] text-gray-600">
              {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
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
            transition={{ duration: 0.22 }}>
            <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {/* User message */}
              <div className="pt-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Your message</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
              </div>

              {/* Admin reply */}
              {ticket.adminReply && (
                <div className="rounded-xl p-4"
                  style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>S</div>
                    <span className="text-[11px] font-semibold text-indigo-400">StorecheckAI Support</span>
                    {ticket.adminRepliedAt && (
                      <span className="text-[11px] text-gray-600 ml-auto">
                        {new Date(ticket.adminRepliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{ticket.adminReply}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  async function loadTickets() {
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTickets(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit."); return; }
      setSuccess(true);
      setSubject("");
      setMessage("");
      loadTickets();
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-sm text-gray-500 mt-1">Questions or issues? We&apos;re here to help.</p>
        </div>
        <button
          onClick={() => { setLoading(true); loadTickets(); }}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* New ticket form */}
      <div ref={formRef} className="rounded-2xl p-6 mb-8"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <MessageCircle className="h-4 w-4 text-indigo-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">New Ticket</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={200}
              placeholder="What do you need help with?"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Describe your issue in detail…"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all resize-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <p className="text-[11px] text-gray-700 mt-1 text-right">{message.length}/5000</p>
          </div>

          {error && (
            <p className="text-xs text-red-400 rounded-lg px-3 py-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-green-400 rounded-lg px-3 py-2 flex items-center gap-2"
              style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <CheckCheck className="h-3.5 w-3.5" />
              Ticket submitted! We&apos;ll reply as soon as possible.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : <><Send className="h-4 w-4" /> Submit Ticket</>}
          </button>
        </form>
      </div>

      {/* Ticket list */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">
          Your Tickets
          {tickets.length > 0 && (
            <span className="ml-2 text-gray-600 font-normal">({tickets.length})</span>
          )}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <MessageCircle className="h-8 w-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No tickets yet. Submit one above if you need help.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
