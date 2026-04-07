import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — StorecheckAI",
  description: "Terms and conditions for using StorecheckAI.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-20 text-gray-300">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-10">Effective Date: April 2026 &middot; Last Updated: April 2026</p>

        <p className="mb-10 leading-relaxed">
          Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using StorecheckAI. By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>By creating an account, purchasing a plan, or using any part of StorecheckAI, you confirm that you are at least 18 years old, that you have the legal capacity to enter into binding agreements, and that you agree to these Terms in full.</p>
        </Section>

        <Section title="2. Description of Service">
          <p className="mb-4">StorecheckAI is an AI-powered online store safety analysis tool. Users submit a store URL, and the Service analyzes it against 20+ trust signals to produce a safety report with a trust score (0&ndash;100), a verdict (BUY / CAUTION / SKIP), a return risk rating, and price comparison.</p>
          <div className="rounded-xl p-4 mb-2" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
            <p className="text-sm text-yellow-200/80">
              <strong className="text-yellow-300">Important:</strong> The analysis provided by StorecheckAI is informational only. It is not financial advice, legal advice, or a guarantee of any outcome. We are not a consumer protection agency. Do not rely solely on our analysis when making purchase decisions.
            </p>
          </div>
        </Section>

        <Section title="3. Account Responsibilities">
          <ul className="space-y-3 list-disc pl-5">
            <li>You are responsible for maintaining the confidentiality of your credentials.</li>
            <li>You are responsible for all activity under your account.</li>
            <li>You agree to provide accurate information when registering.</li>
            <li>Notify us immediately at <a href="mailto:support@storecheckai.com" className="text-indigo-400 hover:text-indigo-300">support@storecheckai.com</a> if you suspect unauthorized access.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p className="mb-4">You agree to use StorecheckAI only for lawful, legitimate purposes. The following are prohibited:</p>
          <ul className="space-y-3 list-disc pl-5">
            <li>Reverse-engineering, scraping, or mirroring the platform through automated means.</li>
            <li>Circumventing rate limits, access controls, or authentication mechanisms.</li>
            <li>Reselling or redistributing analysis reports as your own product without authorization.</li>
            <li>Submitting URLs for the purpose of harassing or unfairly targeting specific businesses.</li>
            <li>Attempting to introduce malicious code or conduct denial-of-service attacks.</li>
          </ul>
        </Section>

        <Section title="5. Payment Terms">
          <ul className="space-y-3 list-disc pl-5">
            <li><strong className="text-white">Plans</strong> — Starter ($2.99/check), Personal ($19.99/mo, 10 checks), Pro ($39.99/mo, 50 checks). Prices in USD, subject to change with notice.</li>
            <li><strong className="text-white">Payment</strong> — All payments processed securely by Stripe.</li>
            <li><strong className="text-white">Auto-Renewal</strong> — Monthly subscriptions auto-renew. You will be charged automatically unless you cancel before renewal.</li>
            <li><strong className="text-white">Cancellation</strong> — Cancel anytime from your dashboard or by contacting support. Takes effect at end of billing period. No prorated refunds.</li>
            <li><strong className="text-white">Refunds</strong> — We do not offer refunds for completed checks or started subscription periods, except where required by applicable law. Contact us within 7 days for billing errors.</li>
          </ul>
        </Section>

        <Section title="6. Disclaimers">
          <p className="mb-4">The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest extent permitted by law:</p>
          <ul className="space-y-3 list-disc pl-5">
            <li>We make no warranties regarding the accuracy, completeness, or reliability of any analysis.</li>
            <li>AI-generated analysis is probabilistic. A high-score store may still be problematic; a low-score store may be legitimate.</li>
            <li>We are not responsible for any purchase decision you make based on our analysis.</li>
            <li>We do not guarantee uninterrupted or error-free service availability.</li>
          </ul>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>To the maximum extent permitted by law, StorecheckAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total aggregate liability shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
        </Section>

        <Section title="8. Intellectual Property">
          <ul className="space-y-3 list-disc pl-5">
            <li>All content, software, design, and analysis methodologies are our intellectual property.</li>
            <li>Reports generated for your URLs are for your personal use only.</li>
            <li>By using the Service, you grant us a non-exclusive license to process the URLs you submit.</li>
          </ul>
        </Section>

        <Section title="9. Termination">
          <p>We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or create legal/operational risk. You may terminate your account at any time by contacting <a href="mailto:support@storecheckai.com" className="text-indigo-400 hover:text-indigo-300">support@storecheckai.com</a>.</p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>We may update these Terms from time to time. For material changes, we will provide at least 7 days&apos; notice via email. Continued use after changes take effect constitutes acceptance.</p>
        </Section>

        <Section title="11. Contact">
          <p>For questions about these Terms, contact us at <a href="mailto:support@storecheckai.com" className="text-indigo-400 hover:text-indigo-300">support@storecheckai.com</a>. We aim to respond within 48 business hours.</p>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <div className="leading-relaxed text-gray-400">{children}</div>
    </section>
  );
}
