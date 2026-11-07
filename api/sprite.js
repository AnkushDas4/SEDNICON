/**
 * Sednicon API — Batch / Sprite Endpoint
 * GET /api/sprite?icons=github,rocket&size=24&color=000000
 * POST /api/sprite { icons: [...], format: "symbol" | "json" }
 * Fetch multiple icons in a single request, returned as an SVG sprite sheet or JSON array.
 */

export const config = { runtime: 'edge' };

import { resolveIcon, svgTransformer } from './_lib/icon-resolver.js';
import { corsHeaders } from './_lib/cors.js';
import { checkRateLimit } from './_lib/redis.js';

const MAX_BATCH_ICONS = 50;

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, { 'Access-Control-Max-Age': '86400' }),
    });
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  let icons = [];
  let format = 'symbol';

  if (request.method === 'GET') {
    const { searchParams } = new URL(request.url);
    const rawIcons = searchParams.get('icons') || '';
    const defaultColor = searchParams.get('color') || 'black';
    const defaultSize = parseInt(searchParams.get('size') || '24', 10);
    const defaultStyle = searchParams.get('style') || null;
    format = searchParams.get('format') || 'symbol';

    icons = rawIcons
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((q) => ({
        q,
        color: defaultColor,
        size: defaultSize,
        style: defaultStyle,
      }));
  } else if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
      });
    }

    icons = body.icons || [];
    format = body.format || 'symbol';
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(icons) || icons.length === 0) {
    return new Response(JSON.stringify({ error: 'icons array or parameter is required' }), {
      status: 400,
      headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  if (icons.length > MAX_BATCH_ICONS) {
    return new Response(JSON.stringify({ error: `Maximum ${MAX_BATCH_ICONS} icons per batch` }), {
      status: 400,
      headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  // Rate limit weighted accurately by the number of requested batch icons
  const batchWeight = Math.max(1, Math.min(MAX_BATCH_ICONS, icons.length));
  const allowed = await checkRateLimit(clientIp, batchWeight);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...corsHeaders(request), 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  // Resolve all icons in parallel
  const results = await Promise.all(
    icons.map(async (item) => {
      if (!item.q) return { q: item.q, error: 'Missing q parameter', source: 'error' };
      const q = String(item.q || '').toLowerCase().trim();
      const rawColor = String(item.color || 'black').trim();
      const hexPart = rawColor.replace(/^#/, '');
      const cleanColor = /^[0-9a-fA-F]{3,8}$/.test(hexPart)
        ? `#${hexPart}`
        : /^[a-zA-Z]+$/.test(rawColor) ? rawColor : '#000000';
      const size = Math.min(2048, Math.max(1, parseInt(item.size, 10) || 24));
      const style = item.style || null;

      try {
        const { svg: svgRaw, source, provider } = await resolveIcon(q, item.set || null, { style });
        const output = svgTransformer(svgRaw, size, cleanColor, null, { style });
        return { q, svg: output, color: cleanColor, size, source, provider };
      } catch {
        return { q, error: 'resolution failed', svg: null, source: 'error', provider: 'unknown' };
      }
    })
  );

  if (format === 'json') {
    return new Response(JSON.stringify({ icons: results }), {
      headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  // Build SVG sprite with semantic symbol IDs
  const symbols = results.map((r, i) => {
    if (!r.svg) return '';
    const inner = r.svg.replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '').trim();
    const safeId = String(r.q || `icon-${i}`).replace(/[^a-zA-Z0-9_-]/g, '-');
    return `<symbol id="${safeId}" viewBox="0 0 ${r.size || 24} ${r.size || 24}">${inner}</symbol>`;
  }).join('\n');

  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">\n${symbols}\n</svg>`;

  return new Response(sprite, {
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
