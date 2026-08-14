/**
 * Sednicon — Shared Icon Resolution Pipeline
 * Refactored from api/render.js for reuse by render.js, sprite.js, and other endpoints.
 */

// ─── 1. CUSTOM BRAND LIBRARY ────────────────────────────────────────────────
export const BRAND_ICONS = {
  google: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.98h5.36c-.28 1.6-1.65 4.38-5.36 4.38-3.23 0-5.85-2.65-5.85-5.96s2.62-5.96 5.85-5.96c1.83 0 3.14.78 3.84 1.44l2.25-2.28C16.7 4.29 14.54 3.5 12.18 3.5c-5.18 0-9.38 4.2-9.38 9.38s4.2 9.38 9.38 9.38c5.4 0 8.98-3.8 8.98-9.14 0-.74-.08-1.42-.16-1.92z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.8 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02 1.42-.4 2.92-.4 4.34 0 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>',
};

export const BRAND_SET = new Set([
  'github','google','apple','microsoft','amazon','meta','twitter','x',
  'linkedin','youtube','netflix','spotify','discord','slack','figma',
  'notion','vercel','docker','kubernetes','android','windows','facebook',
  'instagram','tiktok','whatsapp','telegram','reddit','twitch','stripe',
  'paypal','shopify','wordpress','react','vue','angular','svelte','nextjs',
  'tailwindcss','typescript','javascript','python','rust','golang','kotlin',
  'swift','flutter','firebase','supabase','mongodb','postgresql','mysql',
  'redis','graphql','openai','anthropic','huggingface','cloudflare',
  'netlify','heroku','digitalocean','aws','gcp','azure','npm','github',
  'gitlab','bitbucket','jira','trello','asana','linear',
]);

// Fallback chain per query type
export const FALLBACK_SETS = [
  'material-symbols', 'lucide', 'heroicons', 'tabler', 'phosphor',
  'mdi', 'fluent', 'carbon', 'ion', 'feather',
  'simple-icons', 'game-icons', 'logos', 'skill-icons',
  'flat-color-icons', 'emojione',
];
export const PARALLEL_PROBE_SETS = ['material-symbols', 'lucide', 'heroicons'];

export const FALLBACK_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>';

// ─── SVG SANITIZER ──────────────────────────────────────────────────────────
const DANGEROUS_URL_RE = /^(javascript|data|vbscript):/i;

export function sanitizeSvg(svgString) {
  if (!/<script|<iframe|<object|<embed|<foreignObject| on|javascript:|data:/i.test(svgString)) {
    return svgString;
  }
  let svg = svgString;
  svg = svg.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  svg = svg.replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, '');
  svg = svg.replace(/<object[\s\S]*?<\/object\s*>/gi, '');
  svg = svg.replace(/<embed[\s\S]*?>/gi, '');
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '');
  svg = svg.replace(/<applet[\s\S]*?<\/applet\s*>/gi, '');
  svg = svg.replace(/<link[\s\S]*?>/gi, '');
  svg = svg.replace(/<meta[\s\S]*?>/gi, '');
  svg = svg.replace(/\s+on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)/gi, '');
  svg = svg.replace(/(href|xlink:href)\s*=\s*\"([^\"]*)\"/gi, (m, a, v) => {
    if (DANGEROUS_URL_RE.test((v||'').trim())) return '';
    return m;
  });
  svg = svg.replace(/style\s*=\s*\"([^\"]*)\"/gi, (m, s) => {
    if (/expression\s*\(|url\s*\(\s*[\"']?\s*(javascript|data|vbscript)\:/i.test(s||'')) return '';
    return m;
  });
  return svg;
}

// ── SVG TRANSFORMER ──────────────────────────────────────────────────────────
export function svgTransformer(svgRaw, size, cleanColor) {
  let svg = svgRaw
    .replace(/\s+width=\"[^\"]*\"/g, '')
    .replace(/\s+height=\"[^\"]*\"/g, '');
  svg = svg.replace(/^<svg/, `<svg width=\"${size}\" height=\"${size}\"`);
  svg = svg.replace(/currentColor/gi, cleanColor);
  svg = svg.replace(/fill=\"(?!none\b)[^\"]+\"/gi, `fill=\"${cleanColor}\"']);
  svg = svg.replace(/stroke=\"?!none\b)[^\"]+\"/gi, `stroke=\"${cleanColor}\"`);
  if (!/fill\=/.test(svg)) svg = svg.replace(/^<svg/, `<svg fill=\"${cleanColor}\"`);
  return svg;
}

// ── ICONIFY FETCHER ─────────────────────────────────────────────────────────
async function fetchIconify(prefix, name) {
  try {
    const url = `https://api.iconify.design/${prefix}/${name}.svg`;
    const res = await fetch(url, { headers: { 'Accept': 'image/svg+xml' } });
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type')||'').toLowerCase();
    if (!ct.includes('svg') && !ct.includes('xml') && !ct.includes('plain')) return null;
    const text = await res.text();
    return (text.startsWith('<') && text.includes('<svg')) ? text : null;
  } catch { return null; }
}

// ── BRAND RESOLVER ──────────────────────────────────────────────────────────
export function brandResolver(q) {
  if (BRAND_ICONS[q]) return { svg: BRAND_ICONS[q], source: 'custom-brand' };
  return null;
}

// ── AI RESOLVER ─────────────────────────────────────────────────────────────
export async function aiResolver(q) {
  if (!q.startsWith('ai:')) return null;
  const value = q.slice(3).trim();
  if (!value) return null;

  const SUPABASE_URL = (typeof globalThis !== 'undefined' && globalThis.process)
    ? globalThis.process.env.SUPABASE_URL : undefined;
  // Rely on global env for edge runtime — `process.env` is available in Vercel edge
  const url = SUPABASE_URL;
  if (!url) return null;

  try {
    // Check if value is a content hash (64-char hex = SHA-256) or UUID
    const isHash = /^[a-f0-9]{64}$/.test(value);
    const column = isHash ? 'content_hash' : 'id';
    const apiKey = process.env.SUPABASE_ANON_KEY || '';
    const res = await fetch(
      `${url}/rest/v1/icons?${column}=eq.${encodeURIComponent(value)}&select=svg,hidden&limit=1`,
      {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows?.[0]?.svg) return null;
    return { svg: sanitizeSvg(rows[0].svg), source: 'ai-generated' };
  } catch { return null; }
}

// ── ICONIFY RESOLVER ────────────────────────────────────────────────────────
export async function iconifyResolver(q, setHint) {
  const cleanQ = (q||'').toLowerCase().trim();
  if (cleanQ.includes(':')) {
    const [prefix, ...rest] = cleanQ.split(':');
    const name = rest.join(':');
    const svg = await fetchIconify(prefix, name);
    return svg ? { svg, source: `iconify:${prefix}` } : null;
  }
  if (setHint) {
    const svg = await fetchIconify(setHint, cleanQ.replace(/_/g, '-'));
    if (svg) return { svg, source: `iconify:${setHint}` };
  }
  if (BRAND_SET.has(cleanQ)) {
    const svg = await fetchIconify('simple-icons', cleanQ);
    if (svg) return { svg, source: 'iconify:simple-icons' };
  }
  const hyphenized = cleanQ.replace(/_/g, '-');
  const probes = await Promise.all(
    PARALLEL_PROBE_SETS.map(p => fetchIconify(p, hyphenized).then(s => s ? {svg:s, source:`iconify:${p}`} : null))
  );
  const hit = probes.find(r => r);
  if (hit) return hit;
  for (const p of FALLBACK_SETS) {
    if (PARALLEL_PROBE_SETS.includes(p)) continue;
    const svg = await fetchIconify(p, hyphenized);
    if (svg) return { svg, source: `iconify:${p}` };
  }
  // search fallback
  try {
    const sr = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(cleanQ)}&limit=1`);
    if (!sr.ok) return null;
    const data = await sr.json();
    const icons = data.icons || [];
    if (!icons.length) return null;
    const [sp, sn] = icons[0].split(':');
    const svg = await fetchIconify(sp, sn);
    if (svg) return { svg, source: 'iconify:search' };
  } catch { return null; }
  return null;
}

// ── MAIN RESOLVER ───────────────────────────────────────────────────────────
export async function resolveIcon(q, setHint) {
  let result = null;
  result = await aiResolver(q);
  if (!result) result = brandResolver(q);
  if (!result) result = await iconifyResolver(q, setHint);
  if (!result) result = { svg: FALLBACK_SVG, source: 'generic-fallback' };
  if (result.source !== 'ai-generated') result.svg = sanitizeSvg(result.svg);
  return result;
}