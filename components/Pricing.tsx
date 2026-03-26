"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, MinusCircle, Loader2 } from "lucide-react";
import { useTranslation, type Translations } from "@/lib/i18n";

function getPlans(t: Translations) {
  const f = t.pricing.features;
  const p = t.pricing.plans;
  return [
    {
      key: "starter", name: p[0].name, tag: null,
      price: "$2.99", period: t.pricing.perCheck, overage: null,
      desc: p[0].desc, cta: p[0].cta, highlight: false,
      features: [
        { text: f.basicTrust,         included: true  },
        { text: f.verdictBadge,       included: true  },
        { text: f.reviewSummary,      included: true  },
        { text: f.keyProsCons,        included: true  },
        { text: f.priceComparison,    included: false },
        { text: f.returnRisk,         included: false },
        { text: f.redFlagBreakdown,   included: false },
        { text: f.facebookCheck,      included: false },
        { text: f.reportHistory,      included: false },
      ],
      testimonial: {
        quote: "Saved me from a $140 fake sneaker site. Paid $3 and dodged a scam.",
        author: "Emily R., verified buyer",
      },
    },
    {
      key: "personal", name: p[1].name, tag: t.pricing.mostPopular,
      price: "$19.99", period: t.pricing.perMonth, overage: "$1.25 / check after 10",
      desc: p[1].desc, cta: p[1].cta, highlight: true,
      features: [
        { text: f.checksMonthly10,    included: true },
        { text: f.fullTrustBreakdown, included: true },
        { text: f.verdictBadge,       included: true },
        { text: f.priceComparisonFull,included: true },
        { text: f.returnRisk,         included: true },
        { text: f.suspiciousReviews,  included: true },
        { text: f.redFlagBreakdown,   included: true },
        { text: f.facebookCheck,      included: true },
        { text: f.reportHistorySaved, included: true },
      ],
      testimonial: {
        quote: "I check every store before buying now. The return risk score alone is worth it.",
        author: "Marcus T., online shopper",
      },
    },
    {
      key: "pro", name: p[2].name, tag: null,
      price: "$39.99", period: t.pricing.perMonth, overage: "$1.00 / check after 50",
      desc: p[2].desc, cta: p[2].cta, highlight: false,
      features: [
        { text: f.checksMonthly50,    included: true },
        { text: f.fullTrustBreakdown, included: true },
        { text: f.verdictBadge,       included: true },
        { text: f.priceComparisonFull,included: true },
        { text: f.returnRisk,         included: true },
        { text: f.suspiciousReviews,  included: true },
        { text: f.redFlagBreakdown,   included: true },
        { text: f.facebookCheck,      included: true },
        { text: f.reportHistorySaved, included: true },
      ],
      testimonial: {
        quote: "Our team vets vendors weekly. Pro pays for itself after one avoided bad supplier.",
        author: "Sarah K., sourcing manager",
      },
    },
  ];
}

function usePlanCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(planKey: string) {
    setLoading(planKey);
    try {
      const res  = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planKey }) });
      const data = await res.json() as { url?: string; redirect?: string; error?: string };
      if (res.status === 401) { router.push("/login?from=/#pricing"); return; }
      if (data.url) window.location.href = data.url;
    } finally { setLoading(null); }
  }

  return { checkout, loading };
}

export function Pricing() {
  const { t } = useTranslation();
  const { checkout, loading } = usePlanCheckout();
  const plans = getPlans(t);

  return (
    <section id="pricing" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-14 text-center">
          <span className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
            {t.pricing.badge}
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t.pricing.heading}{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #c084fc)" }}>
              {t.pricing.headingAccent}
            </span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-md mx-auto">{t.pricing.subtitle}</p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3 items-stretch">
          {plans.map((plan, i) => (
            <motion.div key={plan.key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }} className="h-full">
              {plan.highlight ? (
                <div className="relative rounded-3xl p-[1px] h-full"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}>
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold whitespace-nowrap z-10"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    <Zap className="h-3 w-3" />
                    {plan.tag}
                  </div>
                  <div className="flex h-full flex-col rounded-3xl p-8" style={{ background: "#0d0d1a" }}>
                    <PlanContent plan={plan} highlight loading={loading === plan.key} onCheckout={() => checkout(plan.key)} processing={t.pricing.processing} />
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col rounded-3xl p-8"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <PlanContent plan={plan} highlight={false} loading={loading === plan.key} onCheckout={() => checkout(plan.key)} processing={t.pricing.processing} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center text-xs text-gray-600">
          {t.pricing.secureNote}
        </motion.p>
      </div>
    </section>
  );
}

function PlanContent({
  plan, highlight, loading, onCheckout, processing,
}: {
  plan: ReturnType<typeof getPlans>[0];
  highlight: boolean;
  loading: boolean;
  onCheckout: () => void;
  processing: string;
}) {
  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: highlight ? "#a5b4fc" : "#6b7280" }}>
          {plan.name}
        </div>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-extrabold text-white">{plan.price}</span>
          <span className="mb-1.5 text-sm text-gray-500">/{plan.period}</span>
        </div>
        {plan.overage && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.18)", color: "#fbbf24" }}>
            then {plan.overage}
          </div>
        )}
        <p className="mt-3 text-sm text-gray-400 leading-relaxed">{plan.desc}</p>
      </div>

      <ul className="mb-5 flex-1 space-y-2.5">
        {plan.features.map(f => (
          <li key={f.text} className="flex items-center gap-2.5 text-sm"
            style={{ color: f.included ? "#d1d5db" : "#4b5563" }}>
            {f.included
              ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              : <MinusCircle  className="h-4 w-4 shrink-0 text-gray-700" />}
            {f.text}
          </li>
        ))}
      </ul>

      <div className="mb-5 pl-3 py-0.5"
        style={{ borderLeft: "2px solid rgba(255,255,255,0.08)" }}>
        <p className="text-xs italic text-gray-500 leading-relaxed">
          &ldquo;{plan.testimonial.quote}&rdquo;
        </p>
        <p className="mt-1 text-[11px] text-gray-600">{plan.testimonial.author}</p>
      </div>

      <button onClick={onCheckout} disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={highlight
          ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }
          : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db" }}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{processing}</> : plan.cta}
      </button>
    </>
  );
}
