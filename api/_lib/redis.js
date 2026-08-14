/**
 * Sednicon — In-Memory Edge Cache & Rate Limiter
 * Replaces Upstash Redis for a 100% dependency-free architecture.
 */

// In-memory cache for rendered SVGs
const renderCache = new Map();
const MAX_CACHE_ITEMS = 2000;
const CACHE_TTL_MS = 3600 * 1000; // 1 hour

// In-memory rate limiting map
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 120;

export async function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || (now - record.startTime > RATE_LIMIT_WINDOW_MS)) {
    rateLimits.set(ip, { count: 1, startTime: now });
    
    // Periodically clean up stale rate limits to prevent memory leaks
    if (rateLimits.size > 5000) {
      for (const [key, val] of rateLimits.entries()) {
        if (now - val.startTime > RATE_LIMIT_WINDOW_MS) {
          rateLimits.delete(key);
        }
      }
    }
    return true;
  }

  record.count++;
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
  
  // Keep memory footprint small
  if (renderCache.size > MAX_CACHE_ITEMS) {
    renderCache.delete(renderCache.keys().next().value);
  }
}
