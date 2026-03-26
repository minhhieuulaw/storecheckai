import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { buildJsonLd } from "@/lib/structured-data";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StorecheckAI — Is it safe to buy from this store?",
  description:
    "Paste any store or product link and get an instant AI safety report — trust score, review analysis, return risk, and a clear verdict. Free to start.",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://storecheckai.com";
const jsonLdSchemas = buildJsonLd(APP_URL);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <head>
        {jsonLdSchemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className="min-h-full bg-gray-950 text-white antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
