import type { Metadata } from "next";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Star, Users, BarChart2, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — StorecheckAI",
  description: "Simple, transparent pricing. Check stores before you buy. Pay per check or subscribe monthly.",
};

const STATS = [
  { value: "20+",    label: "Trust signals checked per store" },
  { value: "<30s",   label: "Analysis time" },
  { value: "99.9%",  label: "Uptime" },
  { value: "10k+",   label: "Stores analyzed" },
];

const TESTIMONIALS = [
  {
    text: "Saved me from ordering a $200 jacket from a fake store. The report flagged no real reviews and a copied privacy policy. Worth every penny.",
    name: "Sarah K.", role: "Online shopper", stars: 5,
  },
  {
    text: "I use it every time I find a store through a Facebook ad. Has paid for itself many times over.",
    name: "Marcus T.", role: "Pro plan subscriber", stars: 5,
  },
  {
    text: "The price comparison feature caught a store marking up products 300% vs Amazon. Insane.",
    name: "Jenny L.", role: "Personal plan user", stars: 5,
  },
];

const GUARANTEE_ITEMS = [
  "AI analysis in under 30 seconds",
  "20+ trust signals checked per report",
  "Trustpilot review authenticity analysis",
  "Price comparison vs Amazon & Google",
  "Return policy risk assessment",
  "Red flag breakdown",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#07070f", color: "#f3f4f6" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-36 pb-12 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6"
          style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
          <Shield className="h-3.5 w-3.5" />
          Transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
          Stop losing money to{" "}
          <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg,#818cf8,#c084fc)" }}>
            sketchy stores
          </span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
          One report can save you $50–$500. Pick the plan that fits how often you shop online.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-4">
          {STATS.map(s => (
            <div key={s.label} className="rounded-2xl px-4 py-4 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-2xl font-extrabold text-white mb-0.5">{s.value}</div>
              <div className="text-[11px] text-gray-500 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing plans */}
      <Pricing />

      {/* What every plan includes */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-white text-center mb-8">Every report includes</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {GUARANTEE_ITEMS.map(item => (
              <div key={item} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 justify-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mb-10">Trusted by shoppers worldwide</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex gap-0.5">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto rounded-3xl p-10 text-center"
          style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl mx-auto mb-5"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            <BarChart2 className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Still on the fence?
          </h2>
          <p className="text-gray-400 mb-7 text-sm">
            Start with a single check — $2.99 for a full report on any store.
            No subscription required.
          </p>
          <a href="/register"
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            Get started
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-xs text-gray-600 mt-4">No credit card required to sign up</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
