export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const US_HEADERS = {
  "User-Agent": UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

export interface FBCheckResult {
  handle: string;
  pageName: string | null;
  description: string | null;
  followerText: string | null;
  likeCount: number | null;
  talkingAbout: number | null;
  coverImageUrl: string | null;
  adLibraryUrl: string;
  pageUrl: string;
  transparencyUrl: string;
  riskSignals: string[];
  positiveSignals: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  aiSummary: string;
}

function extractPageHandle(raw: string): string | null {
  try {
    const url = raw.trim();
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!u.hostname.includes("facebook.com") && !u.hostname.includes("fb.com")) return null;

    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;

    // Skip non-page paths
    const skip = ["ads", "share", "reel", "watch", "video", "photo", "groups", "events", "marketplace", "stories", "live"];
    if (skip.includes(parts[0])) return null;

    if (parts[0] === "pages") {
      // /pages/name/ID → return last segment
      return parts[parts.length - 1] || null;
    }

    return parts[0];
  } catch {
    return null;
  }
}

interface FBMeta {
  name: string | null;
  description: string | null;
  followerText: string | null;
  likeCount: number | null;
  talkingAbout: number | null;
  coverImageUrl: string | null;
}

function parseFBMeta(html: string): FBMeta {
  const $ = cheerio.load(html);
  const name = $('meta[property="og:title"]').attr("content") || null;
  const rawDesc = $('meta[property="og:description"]').attr("content") || "";
  const coverImageUrl = $('meta[property="og:image"]').attr("content") || null;

  let likeCount: number | null = null;
  let talkingAbout: number | null = null;
  let followerText: string | null = null;
  let description: string | null = null;

  // Format 1: "PageName. 9,911 likes · 1,248 talking about this. Description"
  const likesMatch = rawDesc.match(/([\d,]+)\s+likes?\s*[·•]\s*([\d,]+)\s+talking/i);
  // Format 2: "12,345 followers · Description"  or "12,345 followers"
  const followersMatch = rawDesc.match(/([\d,]+)\s+followers?/i);

  if (likesMatch) {
    likeCount = parseInt(likesMatch[1].replace(/,/g, ""), 10);
    talkingAbout = parseInt(likesMatch[2].replace(/,/g, ""), 10);
    followerText = `${likesMatch[1]} likes · ${likesMatch[2]} talking about this`;
    description = rawDesc.replace(/.*talking about this\.?\s*/i, "").trim() || null;
  } else if (followersMatch) {
    likeCount = parseInt(followersMatch[1].replace(/,/g, ""), 10);
    followerText = `${followersMatch[1]} followers`;
    description = rawDesc.replace(/.*followers?\s*[·•]?\s*/i, "").trim() || null;
  } else {
    description = rawDesc || null;
    // Fallback: JSON embedded in page source
    const jsonMatch = html.match(/"follower_count"\s*:\s*(\d+)/) ||
      html.match(/"followers_count"\s*:\s*(\d+)/);
    if (jsonMatch) {
      likeCount = parseInt(jsonMatch[1], 10);
      followerText = `${likeCount.toLocaleString()} followers`;
    }
  }

  return { name, description, followerText, likeCount, talkingAbout, coverImageUrl };
}

async function fetchFBMeta(handle: string): Promise<FBMeta> {
  const empty: FBMeta = { name: null, description: null, followerText: null, likeCount: null, talkingAbout: null, coverImageUrl: null };

  // Try multiple strategies — minimal headers avoid bot detection best
  const strategies = [
    {
      url: `https://www.facebook.com/${handle}`,
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    },
    {
      url: `https://www.facebook.com/${handle}`,
      headers: { "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", "Accept-Language": "en-US,en;q=0.9" },
    },
  ];

  for (const strategy of strategies) {
    try {
      const res = await fetch(strategy.url, {
        headers: strategy.headers,
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();
      // If Facebook returned a login/error page, skip
      if (html.length < 5000 || html.includes('"login"') || html.includes("You must log in")) continue;
      const meta = parseFBMeta(html);
      if (meta.name || meta.likeCount) return meta; // Got useful data
    } catch {
      continue;
    }
  }
  return empty;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      fbUrl: string;
      pageAgeMonths?: number;
      managerCountry?: string;
    };

    const { fbUrl, pageAgeMonths, managerCountry } = body;
    if (!fbUrl) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const handle = extractPageHandle(fbUrl);
    if (!handle) {
      return NextResponse.json(
        { error: "Could not extract a page handle from this URL. Please paste a Facebook Page URL or ad post link." },
        { status: 400 }
      );
    }

    // Fetch meta từ FB page
    const meta = await fetchFBMeta(handle);

    // ── Phân tích risk signals ────────────────────────────────────
    const riskSignals: string[] = [];
    const positiveSignals: string[] = [];

    // Numeric ID = page may have been renamed
    if (/^\d+$/.test(handle)) {
      riskSignals.push("Page uses a numeric ID — may have been renamed or repurposed");
    }

    // Page age from user input (Page Transparency)
    if (pageAgeMonths !== undefined && pageAgeMonths !== null) {
      if (pageAgeMonths < 3) {
        riskSignals.push(`Page created only ${pageAgeMonths} month${pageAgeMonths === 1 ? "" : "s"} ago — very high risk`);
      } else if (pageAgeMonths < 12) {
        riskSignals.push(`Page is under 1 year old (${pageAgeMonths} months) — proceed with caution`);
      } else if (pageAgeMonths >= 36) {
        positiveSignals.push(`Page has been active for ${Math.floor(pageAgeMonths / 12)} years — established presence`);
      }
    }

    // Manager country
    if (managerCountry) {
      const lower = managerCountry.toLowerCase();
      const highRisk = ["vietnam", "indonesia", "philippines", "nigeria", "ghana", "india", "pakistan", "bangladesh", "cambodia"];
      const medRisk = ["china", "hong kong", "taiwan", "malaysia", "thailand"];
      if (highRisk.some(c => lower.includes(c))) {
        riskSignals.push(`Page managed from ${managerCountry} — commonly associated with dropshipping operations`);
      } else if (medRisk.some(c => lower.includes(c))) {
        riskSignals.push(`Page managed from ${managerCountry} — verify product sourcing`);
      } else {
        positiveSignals.push(`Page managed from ${managerCountry}`);
      }
    }

    // Like/follower count signals
    if (meta.likeCount !== null) {
      if (meta.likeCount < 500) {
        riskSignals.push(`Very low engagement: ${meta.followerText} — new or inactive page`);
      } else if (meta.likeCount < 5000) {
        riskSignals.push(`Low engagement: ${meta.followerText}`);
      } else if (meta.likeCount >= 50000) {
        positiveSignals.push(`Strong following: ${meta.followerText}`);
      } else {
        positiveSignals.push(`${meta.followerText}`);
      }
    }

    // Engagement rate signal (talking about / likes ratio)
    if (meta.likeCount && meta.talkingAbout) {
      const engagementRate = meta.talkingAbout / meta.likeCount;
      if (engagementRate < 0.005) {
        riskSignals.push(`Very low engagement rate (${meta.talkingAbout.toLocaleString()} talking about this) — possible purchased likes`);
      } else if (engagementRate >= 0.05) {
        positiveSignals.push(`High engagement rate: ${meta.talkingAbout.toLocaleString()} people currently talking about this page`);
      }
    }

    // Determine overall risk level
    let riskLevel: FBCheckResult["riskLevel"] = "UNKNOWN";
    if (riskSignals.length >= 2) riskLevel = "HIGH";
    else if (riskSignals.length === 1) riskLevel = "MEDIUM";
    else if (positiveSignals.length > 0 && riskSignals.length === 0) riskLevel = "LOW";

    // ── AI analysis ───────────────────────────────────────────────
    const hasAnySignal = riskSignals.length > 0 || positiveSignals.length > 0 || meta.name || meta.followerText;

    const prompt = hasAnySignal
      ? `Assess this Facebook Page for a US shopper based only on the signals below.
IMPORTANT: Facebook blocks server-side scraping, so missing page name/description/followers is NORMAL for all pages — do NOT treat it as a risk signal.

Handle: ${handle}
Handle type: ${/^\d+$/.test(handle) ? "Numeric ID" : "Named (normal)"}
${meta.name ? `Page name: ${meta.name}` : ""}
${meta.description ? `Description: ${meta.description.slice(0, 300)}` : ""}
${meta.followerText ? `Followers: ${meta.followerText}` : ""}
${pageAgeMonths != null ? `Page age (from Transparency): ${pageAgeMonths} months` : ""}
${managerCountry ? `Managers located in: ${managerCountry}` : ""}
Risk signals: ${riskSignals.length > 0 ? riskSignals.join("; ") : "none"}
Positive signals: ${positiveSignals.length > 0 ? positiveSignals.join("; ") : "none"}

Give 2-3 direct sentences assessing risk for a US shopper based only on the signals above.`
      : `A US shopper wants to verify a Facebook Page with handle "${handle}" before buying from their ad.
Automated data is unavailable (Facebook blocks server-side access — this is normal for all pages).
In 2 sentences, tell them the 2 most important things to manually check in the Page Transparency section to assess trust.`;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });

    const aiSummary = aiRes.choices[0]?.message?.content?.trim() || "Analysis unavailable.";

    const result: FBCheckResult = {
      handle,
      pageName: meta.name,
      description: meta.description,
      followerText: meta.followerText,
      likeCount: meta.likeCount,
      talkingAbout: meta.talkingAbout,
      coverImageUrl: meta.coverImageUrl,
      adLibraryUrl: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(meta.name || handle)}&search_type=page`,
      pageUrl: `https://www.facebook.com/${handle}`,
      transparencyUrl: `https://www.facebook.com/${handle}`,
      riskSignals,
      positiveSignals,
      riskLevel,
      aiSummary,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("FB check error:", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
