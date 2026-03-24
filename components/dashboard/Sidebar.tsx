"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, Shield, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const nav = [
  { href: "/dashboard",          label: "Overview",   icon: LayoutDashboard },
  { href: "/dashboard/reports",  label: "My Reports", icon: FileText },
  { href: "/dashboard/billing",  label: "Billing",    icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings",   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside
      className="flex h-full w-60 flex-col border-r"
      style={{ background: "rgba(9,9,18,0.98)", borderColor: "rgba(255,255,255,0.06)" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <Shield className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">StorecheckAI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  color: active ? "#fff" : "rgba(156,163,175,1)",
                  background: active ? "rgba(99,102,241,0.15)" : "transparent",
                }}>
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className="relative h-4 w-4 shrink-0" style={{ color: active ? "#818cf8" : undefined }} />
                <span className="relative">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-400 transition-colors hover:bg-red-500/5">
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
