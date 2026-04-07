import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Clock, MessageSquare, Wrench, CreditCard, Handshake, Bug } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — StorecheckAI",
  description: "Get in touch with the StorecheckAI team for support, billing, partnerships, or feedback.",
};

const CATEGORIES = [
  { icon: MessageSquare, label: "General Inquiries", desc: "Questions about how StorecheckAI works, what signals we analyze, or how verdicts are generated." },
  { icon: Wrench, label: "Technical Support", desc: "Something not working? A report failed, a check timed out, or you're seeing an error." },
  { icon: CreditCard, label: "Billing Questions", desc: "Charges, plan upgrades/downgrades, cancellations, or refund requests." },
  { icon: Handshake, label: "Partnerships", desc: "Interested in integrating StorecheckAI into your platform or exploring a commercial partnership." },
  { icon: Bug, label: "Bug Reports", desc: "Found something broken or incorrect in our analysis? Include the store URL and what you expected." },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-3">Contact Us</h1>
        <p className="text-gray-400 leading-relaxed mb-10 max-w-xl">
          Whether you have a question, ran into a problem, or just want to say hello — we&apos;d love to hear from you. Our team reads every message and responds personally.
        </p>

        {/* Email + Response time */}
        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          <div
            className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl" style={{ background: "rgba(99,102,241,0.12)" }}>
              <Mail className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Email</p>
              <a href="mailto:support@storecheckai.com" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                support@storecheckai.com
              </a>
            </div>
          </div>
          <div
            className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Response Time</p>
              <p className="text-sm text-gray-500">Within 24&ndash;48 hours on business days</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <h2 className="text-lg font-semibold text-white mb-5">What can we help you with?</h2>
        <div className="space-y-3 mb-12">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.label}
                className="rounded-xl p-4 flex items-start gap-4 transition-colors hover:bg-white/[0.03]"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="shrink-0 mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200 mb-1">{cat.label}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ note */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-sm text-gray-400 leading-relaxed">
            <strong className="text-gray-300">Before you write:</strong> Check our{" "}
            <a href="/#faq" className="text-indigo-400 hover:text-indigo-300 transition-colors">FAQ section</a>{" "}
            — you may find your answer in under a minute. If not, don&apos;t hesitate to reach out. There&apos;s no such thing as a question we won&apos;t answer.
          </p>
        </div>

        <p className="text-xs text-gray-600">
          For urgent billing or account access issues, include &ldquo;URGENT&rdquo; in your subject line and we will prioritize your message.
        </p>
      </main>
      <Footer />
    </>
  );
}
