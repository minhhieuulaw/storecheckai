/**
 * Tests for lib/affiliate.ts — Amazon Affiliate Tag Utility
 *
 * Run: npx tsx lib/__tests__/affiliate.test.ts
 */

import { appendAmazonAffiliateTag, isAmazonShortLink } from "../affiliate";

const TAG = "storecheckai-20";
let passed = 0;
let failed = 0;

function assert(name: string, actual: string, expected: string) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    Expected: ${expected}`);
    console.error(`    Actual:   ${actual}`);
  }
}

function assertBool(name: string, actual: boolean, expected: boolean) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    Expected: ${expected}, Got: ${actual}`);
  }
}

console.log("\n=== appendAmazonAffiliateTag ===\n");

// --- Amazon links without query ---
assert(
  "amazon.com no query",
  appendAmazonAffiliateTag("https://www.amazon.com/dp/B08N5WRWNW", TAG),
  "https://www.amazon.com/dp/B08N5WRWNW?tag=storecheckai-20",
);

assert(
  "amazon.com search no params",
  appendAmazonAffiliateTag("https://www.amazon.com/s", TAG),
  "https://www.amazon.com/s?tag=storecheckai-20",
);

// --- Amazon links with existing query ---
assert(
  "amazon.com with search query",
  appendAmazonAffiliateTag("https://www.amazon.com/s?k=wireless+mouse", TAG),
  "https://www.amazon.com/s?k=wireless+mouse&tag=storecheckai-20",
);

assert(
  "amazon.com with multiple params",
  appendAmazonAffiliateTag("https://www.amazon.com/s?k=keyboard&ref=nb_sb_noss", TAG),
  "https://www.amazon.com/s?k=keyboard&ref=nb_sb_noss&tag=storecheckai-20",
);

// --- Amazon link with old tag (should replace) ---
assert(
  "replace existing tag",
  appendAmazonAffiliateTag("https://www.amazon.com/dp/B08N5WRWNW?tag=oldtag-21", TAG),
  "https://www.amazon.com/dp/B08N5WRWNW?tag=storecheckai-20",
);

assert(
  "replace tag preserving other params",
  appendAmazonAffiliateTag("https://www.amazon.com/s?k=mouse&tag=competitor-20&ref=sr_1", TAG),
  "https://www.amazon.com/s?k=mouse&tag=storecheckai-20&ref=sr_1",
);

// --- Amazon link with correct tag (no-op) ---
assert(
  "already has correct tag",
  appendAmazonAffiliateTag("https://www.amazon.com/s?k=test&tag=storecheckai-20", TAG),
  "https://www.amazon.com/s?k=test&tag=storecheckai-20",
);

// --- Non-Amazon links (unchanged) ---
assert(
  "non-amazon link (google)",
  appendAmazonAffiliateTag("https://www.google.com/search?q=test", TAG),
  "https://www.google.com/search?q=test",
);

assert(
  "non-amazon link (aliexpress)",
  appendAmazonAffiliateTag("https://www.aliexpress.com/wholesale?SearchText=mouse", TAG),
  "https://www.aliexpress.com/wholesale?SearchText=mouse",
);

assert(
  "non-amazon link (ebay)",
  appendAmazonAffiliateTag("https://www.ebay.com/itm/123456", TAG),
  "https://www.ebay.com/itm/123456",
);

// --- Malformed URL ---
assert(
  "malformed URL returns unchanged",
  appendAmazonAffiliateTag("not-a-url", TAG),
  "not-a-url",
);

assert(
  "empty string returns unchanged",
  appendAmazonAffiliateTag("", TAG),
  "",
);

// --- Amazon short links ---
assert(
  "amzn.to short link",
  appendAmazonAffiliateTag("https://amzn.to/3xYz123", TAG),
  "https://amzn.to/3xYz123?tag=storecheckai-20",
);

assert(
  "a.co short link",
  appendAmazonAffiliateTag("https://a.co/d/abcDEF1", TAG),
  "https://a.co/d/abcDEF1?tag=storecheckai-20",
);

// --- International Amazon domains ---
assert(
  "amazon.co.uk",
  appendAmazonAffiliateTag("https://www.amazon.co.uk/dp/B08N5WRWNW", TAG),
  "https://www.amazon.co.uk/dp/B08N5WRWNW?tag=storecheckai-20",
);

assert(
  "amazon.de",
  appendAmazonAffiliateTag("https://amazon.de/s?k=tastatur", TAG),
  "https://amazon.de/s?k=tastatur&tag=storecheckai-20",
);

assert(
  "amazon.co.jp",
  appendAmazonAffiliateTag("https://www.amazon.co.jp/dp/B09V3KXJPB", TAG),
  "https://www.amazon.co.jp/dp/B09V3KXJPB?tag=storecheckai-20",
);

assert(
  "amazon.fr",
  appendAmazonAffiliateTag("https://www.amazon.fr/s?k=souris", TAG),
  "https://www.amazon.fr/s?k=souris&tag=storecheckai-20",
);

assert(
  "amazon.ca",
  appendAmazonAffiliateTag("https://amazon.ca/dp/B123", TAG),
  "https://amazon.ca/dp/B123?tag=storecheckai-20",
);

// --- Uppercase hostname ---
assert(
  "uppercase AMAZON.COM",
  appendAmazonAffiliateTag("https://WWW.AMAZON.COM/s?k=test", TAG),
  "https://www.amazon.com/s?k=test&tag=storecheckai-20",
);

// --- Hash fragment ---
assert(
  "preserves hash fragment",
  appendAmazonAffiliateTag("https://www.amazon.com/dp/B08N5WRWNW#reviews", TAG),
  "https://www.amazon.com/dp/B08N5WRWNW?tag=storecheckai-20#reviews",
);

assert(
  "preserves hash with existing params",
  appendAmazonAffiliateTag("https://www.amazon.com/s?k=mouse#results", TAG),
  "https://www.amazon.com/s?k=mouse&tag=storecheckai-20#results",
);

// --- No tag provided ---
assert(
  "no tag provided returns unchanged",
  appendAmazonAffiliateTag("https://www.amazon.com/s?k=test", ""),
  "https://www.amazon.com/s?k=test",
);

assert(
  "undefined tag returns unchanged",
  appendAmazonAffiliateTag("https://www.amazon.com/s?k=test", undefined),
  "https://www.amazon.com/s?k=test",
);

console.log("\n=== isAmazonShortLink ===\n");

assertBool("amzn.to is short link", isAmazonShortLink("https://amzn.to/3xYz"), true);
assertBool("a.co is short link", isAmazonShortLink("https://a.co/d/abc"), true);
assertBool("amazon.com is NOT short link", isAmazonShortLink("https://www.amazon.com/dp/B123"), false);
assertBool("google.com is NOT short link", isAmazonShortLink("https://google.com"), false);
assertBool("malformed URL returns false", isAmazonShortLink("not-a-url"), false);

// --- Summary ---
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) {
  console.error("\n❌ SOME TESTS FAILED");
  process.exit(1);
} else {
  console.log("\n✅ ALL TESTS PASSED");
}
