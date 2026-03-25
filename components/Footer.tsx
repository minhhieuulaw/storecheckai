"use client";

import { Shield } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer
      className="px-6 py-10"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-6xl flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 text-sm font-bold">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          StorecheckAI
        </div>

        {/* Links */}
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-300 transition-colors">{t.footer.privacy}</a>
          <a href="#" className="hover:text-gray-300 transition-colors">{t.footer.terms}</a>
          <a href="#" className="hover:text-gray-300 transition-colors">{t.footer.contact}</a>
        </div>

        <p className="text-xs text-gray-700">
          © {new Date().getFullYear()} StorecheckAI. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
