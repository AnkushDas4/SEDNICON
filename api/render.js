/**
 * Sednicon API - The Unified Icon Engine v5 (Serverless Edition)
 * Uses shared resolver (_lib/icon-resolver.js), Edge cache + rate limiter
 */

export const config = { runtime: 'edge' };

import { resolveIcon, svgTransformer } from './_lib/icon-resolver.js';
import { corsHeaders } from './_lib/cors.js';
import { checkRateLimit, cacheGet, cacheSet } from './_lib/redis.js';

const RATE_LIMIT_MAX = 120;
const ALLOWED_ANIMS = new Set(['spin', 'pulse', 'bounce']);

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
  const color   = (searchParams.get('color') || 'black').trim();
  const sizeRaw = parseInt(searchParams.get('size') || '24', 10);
  const size    = Number.isFinite(sizeRaw) ? Math.min(2048, Math.max(1, sizeRaw)) : 24;
  const setHint = searchParams.get('set') || null;
  const animRaw = searchParams.get('anim');
  const anim    = animRaw && ALLOWED_ANIMS.has(animRaw) ? animRaw : null;

  // Sanitize color: support hex with or without leading '#', as well as named colors
  const hexPart = color.replace(/^#/, '');
  const cleanColor = /^[0-9a-fA-F]{3,8}$/.test(hexPart)
    ? `#${hexPart}`
    : /^[a-zA-Z]+$/.test(color) ? color : '#000000';

  // Cache key
  const cacheKey = `${q}:${cleanColor}:${size}:${setHint || ''}:${anim || ''}`;

  // ── Check edge cache ──
  const cached = await cacheGet(cacheKey);
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
  const allowed = await checkRateLimit(clientIp, 1);
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
  const output = svgTransformer(svgRaw, size, cleanColor, anim);

  // Cache result in edge cache
  await cacheSet(cacheKey, { svg: output, source });

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
