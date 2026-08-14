/**
 * Sednicon — Upstash Redis Client (REST-based, edge-compatible)
 * Used for: global rate limiting, shared cache across Vercel edge instances
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

async function redisFetch(command, ...args) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    // Build Upstash REST request — command + args joined as path segments
    const path = [command, ...args.map(a => encodeURIComponent(String(a)))].join('/');
    const url = `${REDIS_URL.replace(/\/$/, '')}/${path}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch {
    return null; // fail open
  }
}

// ─── RATE LIMITING ──────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_MAX = 120;

export async function checkRateLimit(ip) {
  const key = `rl:render:${ip}`;
  const result = await redisFetch('INCR', key);
  if (result === null) return true; // Redis down → fail open
  const count = parseInt(result, 10);
  if (count === 1) {
    await redisFetch('EXPIRE', key, String(RATE_LIMIT_WINDOW_SEC));
  }
  return count <= RATE_LIMIT_MAX;
}

// ─── SVG CACHE ──────────────────────────────────────────────────────────────

const CACHE_TTL_SEC = 3600; // 1 hour

export async function cacheGet(key) {
  const raw = await redisFetch('GET', key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function cacheSet(key, value) {
  const json = JSON.stringify(value);
  await redisFetch('SETEX', key, String(CACHE_TTL_SEC), json);
}