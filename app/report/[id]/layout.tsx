import type { Metadata } from "next";
import { getReport } from "@/lib/store";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://storecheckai.com";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return {
      title: "Report not found — StorecheckAI",
    };
  }

  const verdict = report.verdict === "BUY"
    ? "✅ Safe to buy"
    : report.verdict === "CAUTION"
    ? "⚠️ Proceed with caution"
    : "🚨 Avoid this store";

  const score  = report.trustScore;
  const store  = report.storeName;
  const domain = report.domain;

  const title       = `${store} — Trust Score ${score}/100 | StorecheckAI`;
  const description = `${verdict} · ${domain} scored ${score}/100. AI-powered store safety analysis covering reviews, pricing, return policy, and 20+ trust signals.`;
  const pageUrl     = `${APP_URL}/report/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url:       pageUrl,
      siteName:  "StorecheckAI",
      type:      "article",
      images: [
        {
          url:    `${APP_URL}/api/og/report/${id}`,
          width:  1200,
          height: 630,
          alt:    `${store} trust report`,
        },
      ],
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      images:      [`${APP_URL}/api/og/report/${id}`],
      site:        "@storecheckai",
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
