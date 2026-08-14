/**
 * Sednicon API — Batch / Sprite Endpoint (Task E)
 * POST /api/sprite
 * Fetch multiple icons in a single request, returned as a sprite sheet or JSON array.
 */

export const config = { runtime: 'edge' };

import { resolveIcon, svgTransformer } from './_lib/icon-resolver.js';
import { corsHeaders } from './_lib/cors.js';
import { checkRateLimit } from './_lib/redis.js';

const MAX_BATCH_ICONS = 50;

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Max-Age': '86400' }) });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  const icons = body.icons || [];
  const format = body.format || 'symbol';

  if (!Array.isArray(icons) || icons.length === 0) {
    return new Response(JSON.stringify({ error: 'icons array is required' }), {
      status: 400, headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }
  if (icons.length > MAX_BATCH_ICONS) {
    return new Response(JSON.stringify({ error: `Maximum ${MAX_BATCH_ICONS} icons per batch` }), {
      status: 400, headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  // Rate limit: weight by batch size
  const allowed = await checkRateLimit(`${clientIp}:batch:${icons.length}`);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429, headers: { ...corsHeaders(request), 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  // Resolve all icons in parallel
  const results = await Promise.all(
    icons.map(async (item) => {
      if (!item.q) return { q: item.q, error: 'Missing q parameter', source: 'error' };
      const q = String(item.q || '').toLowerCase().trim();
      const color = item.color || 'black';
      const size = Math.min(2048, Math.max(1, parseInt(item.size) || 24));
      const cleanColor = /^[0-9a-fA-F]{3,8}$/.test(color) ? `#${color}` : color;

      try {
        const { svg: svgRaw, source } = await resolveIcon(q, item.set || null);
        const output = svgTransformer(svgRaw, size, cleanColor);
        return { q, svg: output, color: cleanColor, size, source };
      } catch {
        return { q, error: 'resolution failed', svg: null, source: 'error' };
      }
    })
  );

  if (format === 'json') {
    return new Response(JSON.stringify({ icons: results }), {
      headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
  }

  // Build SVG sprite (symbol format)
  const symbols = results.map((r, i) => {
    if (!r.svg) return '';
    // Extract inner content from SVG and wrap in <symbol>
    const inner = r.svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').trim();
    return `<symbol id="icon-${i}" viewBox="0 0 ${r.size || 24} ${r.size || 24}">${inner}</symbol>`;
  }).join('\n');

  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">\n${symbols}\n</svg>`;

  return new Response(sprite, {
    headers: { ...corsHeaders(request), 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}

async function resolveSVG(q, setHint) {
  // Repeated from render.js - could be extracted, but minimal duplication for now
  const { resolveIcon } = await import('./_lib/icon-resolver.js');
  return resolveIcon(q, setHint);
}