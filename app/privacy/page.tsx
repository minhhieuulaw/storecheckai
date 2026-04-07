import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — StorecheckAI",
  description: "How StorecheckAI collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-20 text-gray-300">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-10">Effective Date: April 2026 &middot; Last Updated: April 2026</p>

        <p className="mb-6 leading-relaxed">
          At StorecheckAI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), your privacy matters. This Privacy Policy explains what information we collect when you use storecheckai.com, how we use it, who we share it with, and what control you have over it. We&apos;ve written this in plain language because legal jargon shouldn&apos;t stand between you and understanding how your data is handled.
        </p>
        <p className="mb-10 leading-relaxed">
          By using our service, you agree to the practices described in this policy. If you don&apos;t agree, please discontinue use of the service.
        </p>

        <Section title="1. Information We Collect">
          <p className="mb-4">We collect only what&apos;s necessary to provide and improve the service:</p>
          <ul className="space-y-3 list-disc pl-5">
            <li><strong className="text-white">Account Information</strong> — When you register, we collect your name and email address. Your password is never stored in plain text; it is hashed using PBKDF2, a cryptographic function designed to be resistant to brute-force attacks.</li>
            <li><strong className="text-white">Store URLs You Analyze</strong> — When you submit a URL for analysis, we store that URL along with the resulting safety report. This allows you to access your check history and helps us improve accuracy over time.</li>
            <li><strong className="text-white">IP Address</strong> — We collect your IP address for rate limiting and abuse prevention purposes only.</li>
            <li><strong className="text-white">Payment Information</strong> — Billing is handled entirely by Stripe. We do not store your credit card number, CVV, or full payment details. We receive a Stripe customer ID and subscription status to manage your account.</li>
            <li><strong className="text-white">Usage Data</strong> — We may collect general usage metadata such as the number of checks performed and timestamps. This data is used in aggregate to improve the service.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="space-y-3 list-disc pl-5">
            <li><strong className="text-white">Deliver the service</strong> — analyzing store URLs and returning safety reports, trust scores, and verdicts.</li>
            <li><strong className="text-white">Manage your account</strong> — authentication, session management, and billing status.</li>
            <li><strong className="text-white">Send transactional emails</strong> — account confirmations, password resets, and billing receipts via Resend. We do not send marketing emails without your consent.</li>
            <li><strong className="text-white">Improve our AI</strong> — anonymized URL and report data may be used to refine detection accuracy.</li>
            <li><strong className="text-white">Ensure integrity</strong> — rate limiting, fraud prevention, and abuse detection.</li>
            <li><strong className="text-white">Monitor errors</strong> — Sentry is used for optional error tracking to identify and fix technical issues.</li>
          </ul>
          <p className="mt-4">We do not sell your personal data. We do not use your data to serve targeted advertisements.</p>
        </Section>

        <Section title="3. Third-Party Services">
          <p className="mb-4">We rely on the following third-party services to operate StorecheckAI:</p>
          <ul className="space-y-3 list-disc pl-5">
            <li><strong className="text-white">Stripe</strong> — Payment processing (PCI-DSS compliant).</li>
            <li><strong className="text-white">Resend</strong> — Transactional email delivery.</li>
            <li><strong className="text-white">Anthropic</strong> — Store content may be sent to Claude AI for safety assessments.</li>
            <li><strong className="text-white">OpenAI</strong> — Store content may be processed by GPT-4o for supplementary analysis.</li>
            <li><strong className="text-white">Neon</strong> — Database hosting (PostgreSQL, US East region).</li>
            <li><strong className="text-white">Sentry</strong> — Optional error monitoring.</li>
            <li><strong className="text-white">Hetzner</strong> — Web server hosting (Germany).</li>
          </ul>
          <p className="mt-4">We do not send your personal account details (name, email, password) to AI providers. Only store URL content is transmitted for analysis.</p>
        </Section>

        <Section title="4. Cookies">
          <p className="mb-3">StorecheckAI uses only functional session cookies to keep you logged in. We do not use:</p>
          <ul className="space-y-2 list-disc pl-5">
            <li>Advertising or retargeting cookies</li>
            <li>Third-party analytics cookies</li>
            <li>Cross-site tracking cookies of any kind</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <ul className="space-y-3 list-disc pl-5">
            <li><strong className="text-white">Account data</strong> is retained while your account is active. Upon deletion, data is permanently removed within 30 days.</li>
            <li><strong className="text-white">Analysis reports</strong> are retained as part of your history. You can delete individual reports or request full deletion at any time.</li>
            <li><strong className="text-white">IP addresses</strong> for rate limiting are stored temporarily and purged on a rolling basis.</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          <p className="mb-4">Depending on your location, you may have the following rights:</p>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong className="text-white">Access</strong> — Request a copy of the personal data we hold about you.</li>
            <li><strong className="text-white">Correction</strong> — Ask us to update inaccurate information.</li>
            <li><strong className="text-white">Deletion</strong> — Request that we delete your account and associated data.</li>
            <li><strong className="text-white">Export</strong> — Request your data in a portable format.</li>
          </ul>
          <p className="mt-4">To exercise any of these rights, email <a href="mailto:support@storecheckai.com" className="text-indigo-400 hover:text-indigo-300">support@storecheckai.com</a> with the subject &ldquo;Privacy Request.&rdquo;</p>
        </Section>

        <Section title="7. Security Measures">
          <ul className="space-y-3 list-disc pl-5">
            <li>Passwords are hashed using PBKDF2 with a cryptographic salt.</li>
            <li>All data in transit is encrypted via HTTPS/TLS.</li>
            <li>Rate limiting is enforced at the API level.</li>
            <li>Infrastructure managed by reputable providers (Hetzner, Neon).</li>
          </ul>
        </Section>

        <Section title="8. Children's Privacy">
          <p>StorecheckAI is not directed at children under the age of 13. We do not knowingly collect personal information from anyone under 13. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. For significant changes, we&apos;ll notify you via email. Continued use of the service after changes are posted constitutes your acceptance of the updated policy.</p>
        </Section>

        <Section title="10. Contact">
          <p>For any questions related to this Privacy Policy, contact us at <a href="mailto:support@storecheckai.com" className="text-indigo-400 hover:text-indigo-300">support@storecheckai.com</a>. We aim to respond within 48 hours.</p>
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
