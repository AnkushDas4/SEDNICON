/**
 * Sednicon — Resilient Two-Tier Cache & Sliding-Window Rate Limiter
 * Tier 1: In-memory bounded LRU cache with fine-grained TTL.
 * Tier 2: Non-blocking distributed Redis / Upstash REST with automatic degradation.
 */

const MAX_L1_ITEMS = 3000;
export const DEFAULT_TTL_SEC = 7 * 24 * 3600; // 7 days default for successful SVGs
export const NEGATIVE_TTL_SEC = 60; // 60s for confirmed 404s
export const METADATA_TTL_SEC = 6 * 3600; // 6 hours for package/provider metadata

// ─── L1 IN-MEMORY CACHE (LRU) ────────────────────────────────────────────────
const l1Cache = new Map();

// ─── RATE LIMITER STATE ──────────────────────────────────────────────────────
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 120;

// ─── L2 REDIS CONFIGURATION ──────────────────────────────────────────────────
function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || null;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || null;
  return url && token ? { url, token } : null;
}

let l2Status = getRedisConfig() ? 'connected' : 'disabled';
let lastRedisErrorLog = 0;

function logRedisError(err) {
  l2Status = 'unreachable';
  const now = Date.now();
  // Throttle error logs to once every 60s to avoid spamming serverless logs
  if (now - lastRedisErrorLog > 60000) {
    console.warn(`[Sednicon Cache] L2 Redis error (falling back to L1): ${err.message}`);
    lastRedisErrorLog = now;
  }
}

// ─── CACHE GET ───────────────────────────────────────────────────────────────
export async function cacheGet(key) {
  const now = Date.now();

  // 1. Check L1 Memory Cache
  const l1Hit = l1Cache.get(key);
  if (l1Hit) {
    if (now < l1Hit.expiresAt) {
      // LRU refresh: re-insert key to mark as most recently used
      l1Cache.delete(key);
      l1Cache.set(key, l1Hit);
      return l1Hit.data;
    }
    // Expired
    l1Cache.delete(key);
  }

  // 2. Check L2 Redis Cache (non-blocking)
  const redisConfig = getRedisConfig();
  if (redisConfig) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200); // 1.2s bounded timeout

      const res = await fetch(`${redisConfig.url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${redisConfig.token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        l2Status = 'connected';
        const json = await res.json();
        if (json.result) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          // Backfill into L1 for fast local reuse
          l1Set(key, parsed, DEFAULT_TTL_SEC);
          return parsed;
        }
      }
    } catch (err) {
      logRedisError(err);
    }
  }

  return null;
}

// ─── L1 HELPER ───────────────────────────────────────────────────────────────
function l1Set(key, data, ttlSeconds) {
  // Evict oldest entry if at capacity
  if (l1Cache.size >= MAX_L1_ITEMS) {
    const oldest = l1Cache.keys().next().value;
    if (oldest) l1Cache.delete(oldest);
  }
  l1Cache.set(key, {
    data,
    expiresAt: Date.now() + (ttlSeconds > 0 ? ttlSeconds * 1000 : 0),
  });
}

// ─── CACHE SET ───────────────────────────────────────────────────────────────
export async function cacheSet(key, value, ttlSeconds = DEFAULT_TTL_SEC) {
  // 1. Store in L1 immediately
  l1Set(key, value, ttlSeconds);

  // 2. Persist to L2 Redis asynchronously without blocking response
  const redisConfig = getRedisConfig();
  if (redisConfig) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);

      const payload = typeof value === 'string' ? value : JSON.stringify(value);
      await fetch(
        `${redisConfig.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(payload)}?ex=${Math.round(ttlSeconds)}`,
        {
          headers: { Authorization: `Bearer ${redisConfig.token}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      l2Status = 'connected';
    } catch (err) {
      logRedisError(err);
    }
  }
}

// ─── NEGATIVE CACHE (CONFIRMED 404s) ──────────────────────────────────────────
export async function cacheSetNegative(key, ttlSeconds = NEGATIVE_TTL_SEC) {
  // Only cache confirmed missing icons for a brief window (e.g. 60s)
  return cacheSet(key, { missing: true }, ttlSeconds);
}

// ─── RATE LIMITING (SLIDING WINDOW) ──────────────────────────────────────────
export async function checkRateLimit(ip, weight = 1) {
  const inc = Math.max(1, Number(weight) || 1);
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(ip, { count: inc, startTime: now });

    // Periodic cleanup of stale IP records
    if (rateLimits.size > 5000) {
      for (const [k, v] of rateLimits.entries()) {
        if (now - v.startTime > RATE_LIMIT_WINDOW_MS) {
          rateLimits.delete(k);
        }
      }
    }
    return inc <= RATE_LIMIT_MAX;
  }

  record.count += inc;
  return record.count <= RATE_LIMIT_MAX;
}

// ─── METRICS & TESTING ───────────────────────────────────────────────────────
export function getCacheMetrics() {
  return {
    l1Items: l1Cache.size,
    maxL1Items: MAX_L1_ITEMS,
    l2Status,
  };
}

export function resetCacheState() {
  l1Cache.clear();
  rateLimits.clear();
}
