import type { MetadataRoute } from "next";
import { getAllAnalyzedDomains } from "@/lib/public-data";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://storecheckai.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/database`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ];

  // Dynamic store pages — one per analyzed domain
  let storePages: MetadataRoute.Sitemap = [];
  try {
    const domains = await getAllAnalyzedDomains();
    storePages = domains.map(domain => ({
      url: `${BASE_URL}/store/${domain}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable at build time — static pages only
  }

  return [...staticPages, ...storePages];
}
