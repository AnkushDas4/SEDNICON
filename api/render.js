/**
 * Sednicon API - The Unified Icon Engine v5 (Serverless Edition)
 * Uses shared resolver (_lib/icon-resolver.js), Redis cache + rate limiter
 */

export const config = { runtime: 'edge' };

import { resolveIcon, svgTransformer } from './_lib/icon-resolver.js';
import { corsHeaders } from './_lib/cors.js';
import { checkRateLimit, cacheGet, cacheSet } from './_lib/redis.js';

const RATE_LIMIT_MAX = 120;

// In-memory fallback cache (used when Redis is unavailable)
const memCache = new Map();
const MEM_CACHE_MAX = 2000;
const CACHE_TTL_MS = 3_600_000;

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

  // Sanitize color
  const cleanColor = /^[0-9a-fA-F]{3,8}$/.test(color)
    ? `#${color}` : /^[a-zA-Z]+$/.test(color) ? color : '#000000';

  const cacheKey = `${q}:${cleanColor}:${size}:${setHint||''}`;

  // ── Check cache (Redis first, then memory fallback) ──
  let cachedFrom = 'none';
  let cached = await cacheGet(cacheKey);
  
  if (!cached) {
    const mem = memCache.get(cacheKey);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
      cached = mem;
      cachedFrom = 'memory';
    } else if (mem) {
      memCache.delete(cacheKey);
    }
  } else {
    cachedFrom = 'redis';
  }

  if (cached) {
    return new Response(cached.svg, {
      headers: corsHeaders(request, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000, immutable',
        'X-Sednicon-Source': cached.source,
        'X-Sednicon-Cache': 'HIT',
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
        'X-RateLimit-Window': '60s',
      }),
    });
  }

  // ── Rate limit (Per-IP) ──
  const allowed = await checkRateLimit(clientIp);
  if (!allowed) {
    return new Response(
      '<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="16" text-anchor="middle" font-size="10" fill="#ef4444">429</text></svg>',
      {
        status: 429,
        headers: corsHeaders(request, {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Window': '60s',
        }),
      }
    );
  }

  // ── Resolve icon ──
  const { svg: svgRaw, source } = await resolveIcon(q, setHint);

  // Apply style transforms
  let output = svgTransformer(svgRaw, size, cleanColor);

  // Cache result
  await cacheSet(cacheKey, { svg: output, source });
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
