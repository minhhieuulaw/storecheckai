"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Shield, ArrowLeft, Zap, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PLAN_INFO: Record<string, {
  name: string; price: string; billing: string;
  checks: string; color: string; features: string[];
}> = {
  starter: {
    name: "Starter",
    price: "$2.99",
    billing: "one-time",
    checks: "1 check",
    color: "#60a5fa",
    features: ["1 store safety check", "Full trust score", "Basic report", "Valid forever"],
  },
  personal: {
    name: "Personal",
    price: "$19.99",
    billing: "/month",
    checks: "10 checks/mo",
    color: "#a78bfa",
    features: ["10 checks per month", "Full AI analysis", "Price comparison", "FB ad checker", "History"],
  },
  pro: {
    name: "Pro",
    price: "$39.99",
    billing: "/month",
    checks: "50 checks/mo",
    color: "#f59e0b",
    features: ["50 checks per month", "Everything in Personal", "Priority analysis", "Export reports", "API access"],
  },
};

function CheckoutForm({ plan }: { plan: string }) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, embedded: true }),
      });
      const data = await res.json() as { clientSecret?: string; error?: string; redirect?: string };
      if (data.redirect) { router.push(data.redirect); return; }
      if (data.error) { setError(data.error); return; }
      if (data.clientSecret) setClientSecret(data.clientSecret);
    } catch {
      setError("Failed to load checkout. Please try again.");
    }
  }, [plan, router]);

  useEffect(() => { fetchClientSecret(); }, [fetchClientSecret]);

  const info = PLAN_INFO[plan];

  return (
    <div className="min-h-screen" style={{ background: "#07070f" }}>
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(7,7,15,0.8)", backdropFilter: "blur(12px)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">StorecheckAI</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="h-3 w-3" />
          Secured by Stripe
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px] items-start">

          {/* Left — Plan summary */}
          {info && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Complete your purchase</h1>
                <p className="text-gray-500 text-sm">You're one step away from safer shopping.</p>
              </div>

              {/* Plan card */}
              <div className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${info.color}25` }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4" style={{ color: info.color }} />
                      <span className="text-sm font-bold" style={{ color: info.color }}>{info.name} Plan</span>
                    </div>
                    <p className="text-xs text-gray-500">{info.checks}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{info.price}</span>
                    <span className="text-sm text-gray-500">{info.billing}</span>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {info.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: info.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "🔒", label: "SSL encrypted" },
                  { icon: "⚡", label: "Instant access" },
                  { icon: "↩️", label: "Cancel anytime" },
                ].map(b => (
                  <div key={b.label} className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-lg mb-1">{b.icon}</div>
                    <p className="text-[11px] text-gray-500">{b.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Payment processed securely by Stripe. We never store your card details.
                Subscriptions auto-renew monthly and can be cancelled at any time from your billing dashboard.
              </p>
            </div>
          )}

          {/* Right — Stripe Embedded Checkout */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            {error ? (
              <div className="p-8 text-center">
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <button onClick={fetchClientSecret}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  Try again
                </button>
              </div>
            ) : !clientSecret ? (
              <div className="p-8 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent mb-3" />
                <p className="text-sm text-gray-500">Loading payment form...</p>
              </div>
            ) : (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#6366f1",
                      colorBackground: "#0d0d1a",
                      colorText: "#e5e7eb",
                      colorDanger: "#f87171",
                      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                      borderRadius: "12px",
                      spacingUnit: "4px",
                    },
                  },
                }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPayPage() {
  return (
    <Suspense>
      <CheckoutPayContent />
    </Suspense>
  );
}

function CheckoutPayContent() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = params.get("plan");

  if (!plan || !PLAN_INFO[plan]) {
    router.replace("/dashboard/billing");
    return null;
  }

  return <CheckoutForm plan={plan} />;
}
