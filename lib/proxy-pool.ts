/**
 * Proxy Pool Manager
 *
 * Provides rotating HTTP proxies as FALLBACK for Amazon/AliExpress scraping
 * when direct requests fail (503, CAPTCHA, rate limit).
 *
 * Primary path is ALWAYS direct scrape (faster + free). Proxies are invoked
 * only on retry after a failed direct attempt.
 *
 * Proxy health tracking: failed proxies are temporarily blacklisted for 5 min.
 *
 * Env:
 *   PROXY_POOL       — comma-separated list of user:pass@host:port entries
 *   PROXYV6_API_KEY  — optional, for fetching fresh pool from proxyv6.net API
 */

interface ProxyEntry {
  url: string;             // http://user:pass@host:port
  failCount: number;
  blacklistedUntil: number; // timestamp ms
}

const BLACKLIST_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAIL_BEFORE_BLACKLIST = 2;

let proxyPoolCache: ProxyEntry[] | null = null;

/**
 * Parse PROXY_POOL env var into proxy entries.
 * Format: user:pass@host:port,user:pass@host:port,...
 */
function parseProxyPool(): ProxyEntry[] {
  const raw = process.env.PROXY_POOL;
  if (!raw) return [];

  return raw
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(entry => {
      // Validate format: user:pass@host:port
      if (!/^[^:]+:[^@]+@[^:]+:\d+$/.test(entry)) {
        console.warn(`[proxy-pool] Invalid proxy entry format: ${entry.slice(0, 20)}...`);
        return null;
      }
      return {
        url: `http://${entry}`,
        failCount: 0,
        blacklistedUntil: 0,
      };
    })
    .filter((e): e is ProxyEntry => e !== null);
}

function getPool(): ProxyEntry[] {
  if (proxyPoolCache === null) {
    proxyPoolCache = parseProxyPool();
    if (proxyPoolCache.length > 0) {
      console.log(`[proxy-pool] Loaded ${proxyPoolCache.length} proxies`);
    }
  }
  return proxyPoolCache;
}

/**
 * Get a random healthy proxy from the pool.
 * Returns null if pool is empty or all proxies are blacklisted.
 */
export function pickProxy(): string | null {
  const pool = getPool();
  if (pool.length === 0) return null;

  const now = Date.now();
  const healthy = pool.filter(p => p.blacklistedUntil < now);
  if (healthy.length === 0) {
    // All blacklisted — unblock them (5 min cycle)
    pool.forEach(p => {
      if (p.blacklistedUntil < now) return;
      p.blacklistedUntil = 0;
      p.failCount = 0;
    });
    const retry = pool.filter(p => p.blacklistedUntil < now);
    if (retry.length === 0) return null;
    return retry[Math.floor(Math.random() * retry.length)].url;
  }

  return healthy[Math.floor(Math.random() * healthy.length)].url;
}

/**
 * Report a proxy failure. Increments failCount; blacklists after threshold.
 */
export function reportProxyFailure(proxyUrl: string): void {
  const pool = getPool();
  const entry = pool.find(p => p.url === proxyUrl);
  if (!entry) return;
  entry.failCount++;
  if (entry.failCount >= MAX_FAIL_BEFORE_BLACKLIST) {
    entry.blacklistedUntil = Date.now() + BLACKLIST_DURATION_MS;
    console.warn(`[proxy-pool] Blacklisted ${proxyUrl.replace(/\/\/[^@]+@/, "//***@")} for 5min after ${entry.failCount} failures`);
  }
}

/**
 * Report a proxy success. Resets failCount.
 */
export function reportProxySuccess(proxyUrl: string): void {
  const pool = getPool();
  const entry = pool.find(p => p.url === proxyUrl);
  if (entry) {
    entry.failCount = 0;
    entry.blacklistedUntil = 0;
  }
}

export function isProxyPoolConfigured(): boolean {
  return getPool().length > 0;
}

export function getPoolStats(): { total: number; healthy: number; blacklisted: number } {
  const pool = getPool();
  const now = Date.now();
  const blacklisted = pool.filter(p => p.blacklistedUntil >= now).length;
  return {
    total: pool.length,
    healthy: pool.length - blacklisted,
    blacklisted,
  };
}
