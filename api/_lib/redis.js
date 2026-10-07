/**
 * Sednicon — In-Memory Edge Cache & Rate Limiter
 * 100% dependency-free edge-compatible cache and sliding-window rate limiter.
 */

// In-memory cache for rendered SVGs
const renderCache = new Map();
const MAX_CACHE_ITEMS = 2000;
const CACHE_TTL_MS = 3600 * 1000; // 1 hour

// In-memory rate limiting map
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 120;

export async function checkRateLimit(ip, weight = 1) {
  const inc = Math.max(1, Number(weight) || 1);
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || (now - record.startTime > RATE_LIMIT_WINDOW_MS)) {
    rateLimits.set(ip, { count: inc, startTime: now });
    
    // Periodically clean up stale rate limits to prevent memory leaks
    if (rateLimits.size > 5000) {
      for (const [key, val] of rateLimits.entries()) {
        if (now - val.startTime > RATE_LIMIT_WINDOW_MS) {
          rateLimits.delete(key);
        }
      }
    }
    return inc <= RATE_LIMIT_MAX;
  }

  record.count += inc;
  return record.count <= RATE_LIMIT_MAX;
}

export async function cacheGet(key) {
  const hit = renderCache.get(key);
  if (hit && (Date.now() - hit.timestamp < CACHE_TTL_MS)) {
    return hit.data;
  }
  if (hit) renderCache.delete(key);
  return null;
}

export async function cacheSet(key, value) {
  renderCache.set(key, { data: value, timestamp: Date.now() });
  
  // Keep memory footprint bounded
  if (renderCache.size > MAX_CACHE_ITEMS) {
    const oldestKey = renderCache.keys().next().value;
    if (oldestKey) renderCache.delete(oldestKey);
  }
}

// Reset function for testing and state reset
export function resetState() {
  renderCache.clear();
  rateLimits.clear();
}
