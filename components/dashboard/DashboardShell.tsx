"use client";

import { useState, useEffect } from "react";
import { Menu, X, Shield } from "lucide-react";
import { Sidebar } from "./Sidebar";
import styles from "./DashboardShell.module.css";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className={styles.wrapper}>

      {/* ── Desktop sidebar (hidden via CSS on mobile) ── */}
      <div className={styles.sidebar}>
        <Sidebar />
      </div>

      {/* ── Mobile overlay drawer (only rendered when open) ── */}
      {mobileOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* Sidebar panel */}
          <div style={{
            position: "absolute", top: 0, left: 0, bottom: 0,
            display: "flex", zIndex: 1,
          }}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Mobile top bar (hidden via CSS on desktop) ── */}
      <header className={styles.mobileHeader}>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{
            width: 40, height: 40, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#9ca3af", background: "none", border: "none", cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Menu style={{ width: 20, height: 20 }} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          }}>
            <Shield style={{ width: 14, height: 14, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
            StorecheckAI
          </span>
        </div>

        {/* Right spacer — keeps logo centered */}
        <div style={{ width: 40 }} />
      </header>

      {/* ── Main content ── */}
      <main className={styles.main}>
        {/* Pushes content below fixed mobile header on mobile only */}
        <div className={styles.mobileSpacerInner} />
        {children}
      </main>
    </div>
  );
}
