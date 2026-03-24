"use client";

import { Shield, Menu, X, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = ["How it works", "Sample report", "Pricing", "FAQ"] as const;

interface UserDisplay { email: string; name: string; }

function readUserDisplay(): UserDisplay | null {
  try {
    const cookie = document.cookie.split(";").find(c => c.trim().startsWith("user_display="));
    if (!cookie) return null;
    const val = decodeURIComponent(cookie.split("=").slice(1).join("=").trim());
    return JSON.parse(val) as UserDisplay;
  } catch {
    return null;
  }
}

export function Navbar() {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user,     setUser]     = useState<UserDisplay | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setUser(readUserDisplay());
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-5">
      <nav
        className="w-full max-w-4xl rounded-2xl border transition-all duration-300"
        style={{
          background: scrolled ? "rgba(7,7,15,0.88)" : "rgba(255,255,255,0.035)",
          borderColor: scrolled ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
        }}>
        <div className="flex items-center justify-between px-5 py-3.5">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">StorecheckAI</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7 text-sm text-gray-500">
            {NAV_LINKS.map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                className="relative py-1 hover:text-white transition-colors duration-200 group">
                {label}
                {/* Animated underline on hover */}
                <span
                  className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-200 rounded-full"
                  style={{ background: "rgba(99,102,241,0.6)" }}
                />
              </a>
            ))}
          </div>

          {/* User info + logout / CTA */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <a
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>
                <User className="h-3.5 w-3.5" />
                {user.name.split(" ")[0]}
              </a>
              <motion.button
                onClick={handleLogout}
                whileHover={{ opacity: 0.8 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-400 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </motion.button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <a
                href="/login"
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
                Sign in
              </a>
              <a
                href="/register"
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Register
              </a>
            </div>
          )}

          {/* Mobile toggle */}
          <motion.button
            onClick={() => setOpen(!open)}
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg">
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.div key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}>
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}>
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile menu — animated */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="md:hidden overflow-hidden border-t"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="px-5 py-4 flex flex-col gap-1">
                {NAV_LINKS.map((label, i) => (
                  <motion.a
                    key={label}
                    href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.18 }}
                    className="rounded-xl px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all">
                    {label}
                  </motion.a>
                ))}
                {user ? (
                  <>
                    <motion.a
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: NAV_LINKS.length * 0.04, duration: 0.18 }}
                      className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-300"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
                      <User className="h-4 w-4" />
                      Dashboard
                    </motion.a>
                    <motion.button
                      onClick={() => { setOpen(false); handleLogout(); }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (NAV_LINKS.length + 1) * 0.04, duration: 0.18 }}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-400"
                      style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)" }}>
                      <LogOut className="h-4 w-4" />
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <motion.a
                      href="/login"
                      onClick={() => setOpen(false)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: NAV_LINKS.length * 0.04, duration: 0.18 }}
                      className="flex-1 text-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
                      Sign in
                    </motion.a>
                    <motion.a
                      href="/register"
                      onClick={() => setOpen(false)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (NAV_LINKS.length + 0.5) * 0.04, duration: 0.18 }}
                      className="flex-1 text-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                      Register
                    </motion.a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
