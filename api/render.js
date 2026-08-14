/**
 * Sednicon API - The Unified Icon Engine v5
 * Uses shared resolver (_lib/icon-resolver.js), Redis cache + rate limiter
 */

export const config = { runtime: 'edge' };

import { resolveIcon, svgTransformer, sanitizeSvg } from './_lib/icon-resolver.js';
import { corsHeaders } from './_lib/cors.js';
import { checkRateLimit, cacheGet, cacheSet } from './_lib/redis.js';

const RATE_LIMIT_MAX = 120;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// In-memory fallback cache (used when Redis is unavailable)
const memCache = new Map();
const MEM_CACHE_MAX = 2000;
const CACHE_TTL_MS = 3_600_000;

// ─── API KEY VERIFICATION (Task H) ───────────────────────────────────────────
async function verifyApiKey(rawKey) {
  if (!rawKey) return null;
  try {
    // Hash the incoming key
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey));
    const keyHash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/api_keys?key_hash=eq.${keyHash}&revoked_at=is.null&select=id,user_id,monthly_quota&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] || null;
  } catch { return null; }
}

async function trackUsage(keyId) {
  try {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const key = `usage:${keyId}:${month}`;
    // Increment in Redis for global counter
    const url = `${process.env.UPSTASH_REDIS_REST_URL || ''}/INCR/${key}`;
    if (process.env.UPSTASH_REDIS_REST_TOKEN) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      });
      if (res.ok) {
        const data = await res.json();
        return parseInt(data.result, 10);
      }
    }
  } catch { /* fail open — don't block render if tracking fails */ }
  return 0;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, { 'Access-Control-Max-Age': '86400' }),
    });
  }

  // Extract client IP
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Parse params
  const { searchParams } = new URL(request.url);
  const q       = (searchParams.get('q') || 'circle').toLowerCase().trim();
  const color   = searchParams.get('color') || 'black';
  const sizeRaw = parseInt(searchParams.get('size') || '24', 10);
  const size    = Number.isFinite(sizeRaw) ? Math.min(2048, Math.max(1, sizeRaw)) : 24;
  const setHint = searchParams.get('set') || null;
  const format  = searchParams.get('format') || 'svg';
  const apiKey  = searchParams.get('key') || null;  // Task H: per-account API key

  // Sanitize color
  const cleanColor = /^[0-9a-fA-F]{3,8}$/.test(color)
    ? `#${color}` : /^[a-zA-Z]+$/.test(color) ? color : '#000000';

  const cacheKey = `${q}:${cleanColor}:${size}:${setHint||''}:${format}`;

  // ── Check cache (Redis first, then memory fallback) ──
  let cachedFrom = 'none';
  let cached = await cacheGet(cacheKey);
  if (!cached) {
    // Memory cache fallback (still in-memory for when Redis is down)
    const mem = memCache.get(cacheKey);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) cached = mem;
    else if (mem) memCache.delete(cacheKey);
  } else {
    cachedFrom = 'redis';
  }

  if (cached) {
    return new Response(cached.svg, {
      headers: corsHeaders(request, {
        'Content-Type': format === 'png' ? 'image/png' :
                        format === 'webp' ? 'image/webp' :
                        'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000, immutable',
        'X-Sednicon-Source': cached.source,
        'X-Sednicon-Cache': 'HIT',
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
        'X-RateLimit-Window': '60s',
      }),
    });
  }

  // ── API Key verification / rate limit ──
  let keyInfo = null;
  let keyStatus = 'none';

  if (apiKey) {
    keyInfo = await verifyApiKey(apiKey);
    if (keyInfo) {
      keyStatus = 'valid';
      // Track usage against monthly quota
      const usage = await trackUsage(keyInfo.id);
      if (usage > keyInfo.monthly_quota) {
        keyStatus = 'quota_exceeded';
        keyInfo = null; // fall through to per-IP limit
      }
    } else {
      keyStatus = 'invalid';
    }
  }

  // If no valid key, use per-IP rate limit
  if (!keyInfo) {
    const allowed = await checkRateLimit(clientIp);
    if (!allowed) {
      return new Response(
        '<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="16" text-anchor="middle" font-size="10" fill="#ef4444">429</text></svg>',
        {
          status: 429,
          headers: corsHeaders(request, {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Retry-After': '60',
            'X-RateLimit-Limit': apiKey ? 'key-quota-exceeded' : String(RATE_LIMIT_MAX),
            'X-RateLimit-Window': '60s',
            'X-Sednicon-Key-Status': keyStatus,
          }),
        }
      );
    }
  }

  // ── Resolve icon ──
  const { svg: svgRaw, source } = await resolveIcon(q, setHint);

  // Apply style transforms
  let output = svgTransformer(svgRaw, size, cleanColor);

  // Cache result
  await cacheSet(cacheKey, { svg: output, source });
  // Also store in memory cache
  memCache.set(cacheKey, { svg: output, source, timestamp: Date.now() });
  if (memCache.size > MEM_CACHE_MAX) {
    const iter = memCache.keys();
    for (let i = 0; i < memCache.size - MEM_CACHE_MAX; i++) memCache.delete(iter.next().value);
  }

  return new Response(output, {
    headers: corsHeaders(request, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000, immutable',
      'X-Sednicon-Source': source,
      'X-Sednicon-Cache': 'MISS',
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
      'X-RateLimit-Window': '60s',
    }),
  });
}