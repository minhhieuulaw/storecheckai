"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Shield, ArrowLeft, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const res = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embedded: true }),
        });

        const data = await res.json() as { clientSecret?: string; error?: string };

        if (!mounted) return;
        if (data.error) { setError(data.error); setLoading(false); return; }
        if (!data.clientSecret) { setError("Failed to load portal."); setLoading(false); return; }

        const stripe = await stripePromise;
        if (!stripe || !containerRef.current) return;

        setLoading(false);

        // @ts-expect-error — initEmbeddedPortal is not yet typed in @stripe/stripe-js
        const portal = await stripe.initEmbeddedPortal({ clientSecret: data.clientSecret });
        portal.mount(containerRef.current);
      } catch (err) {
        if (mounted) { setError(String(err)); setLoading(false); }
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#07070f" }}>
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
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

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button
          onClick={() => router.push("/dashboard/billing")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Manage Subscription</h1>
          <p className="text-gray-500 text-sm">Update payment method, cancel or change your plan.</p>
        </div>

        {/* Portal container */}
        <div className="rounded-2xl overflow-hidden bg-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)", minHeight: 400 }}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              <p className="text-sm text-gray-500">Loading billing portal...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => router.push("/dashboard/billing")}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                Go back
              </button>
            </div>
          )}
          <div ref={containerRef} />
        </div>
      </div>
    </div>
  );
}
