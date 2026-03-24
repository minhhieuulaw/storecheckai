import { Shield } from "lucide-react";

export function Footer() {
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
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#" className="hover:text-gray-300 transition-colors">
              {l}
            </a>
          ))}
        </div>

        <p className="text-xs text-gray-700">
          © {new Date().getFullYear()} StorecheckAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
