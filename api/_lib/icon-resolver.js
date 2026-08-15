/**
 * Sednicon — Bulletproof Icon Resolution Pipeline
 * Features: Mirror domain failover, synonym aliasing, and multi-set probing.
 */

// ─── 1. HOSTS & FALLBACKS ───────────────────────────────────────────────────
const ICONIFY_HOSTS = [
  'https://api.iconify.design',
  'https://api.simplesvg.com',
  'https://api.unisvg.com'
];

export const BRAND_ICONS = {
  google: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.98h5.36c-.28 1.6-1.65 4.38-5.36 4.38-3.23 0-5.85-2.65-5.85-5.96s2.62-5.96 5.85-5.96c1.83 0 3.14.78 3.84 1.44l2.25-2.28C16.7 4.29 14.54 3.5 12.18 3.5c-5.18 0-9.38 4.2-9.38 9.38s4.2 9.38 9.38 9.38c5.4 0 8.98-3.8 8.98-9.14 0-.74-.08-1.42-.16-1.92z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.8 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02 1.42-.4 2.92-.4 4.34 0 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>',
};

// Common keyword aliases to normalize naming differences across sets
const KEYWORD_ALIASES = {
  trash: 'delete',
  garbage: 'delete',
  remove: 'close',
  gear: 'settings',
  cog: 'settings',
  magnify: 'search',
  mail: 'email',
  message: 'chat',
  user: 'person',
  users: 'people',
  house: 'home',
  lock_closed: 'lock',
  unlock: 'lock-open',
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
  'netlify','heroku','digitalocean','aws','gcp','azure','npm',
  'gitlab','bitbucket','jira','trello','asana','linear',
]);

export const FALLBACK_SETS = [
  'material-symbols', 'lucide', 'heroicons', 'tabler', 'phosphor',
  'mdi', 'fluent', 'carbon', 'ion', 'feather',
  'simple-icons', 'game-icons', 'logos', 'skill-icons',
  'flat-color-icons', 'emojione',
];
export const PARALLEL_PROBE_SETS = ['material-symbols', 'lucide', 'heroicons'];

export const FALLBACK_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>';

// ─── SVG SANITIZER ──────────────────────────────────────────────────────────
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
  svg = svg.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  svg = svg.replace(/(href|xlink:href)\s*=\s*"([^"]*)"/gi, (m, a, v) => {
    if (/^(javascript|data|vbscript|file):/i.test((v || '').trim())) return '';
    return m;
  });
  return svg;
}

// ─── SVG TRANSFORMER (Now with Animations) ──────────────────────────────────
export function svgTransformer(svgRaw, size, cleanColor, anim) {
  let svg = svgRaw
    .replace(/\s+width="[^"]*"/g, '')
    .replace(/\s+height="[^"]*"/g, '');
  svg = svg.replace(/^<svg/, `<svg width="${size}" height="${size}"`);
  svg = svg.replace(/currentColor/gi, cleanColor);
  svg = svg.replace(/fill="(?!none\b)[^"]+"/gi, `fill="${cleanColor}"`);
  svg = svg.replace(/stroke="(?!none\b)[^"]+"/gi, `stroke="${cleanColor}"`);
  if (!/fill=/.test(svg)) svg = svg.replace(/^<svg/, `<svg fill="${cleanColor}"`);

  // --- Add Magic Animations ---
  if (anim) {
    let animStyle = '';
    const uid = Math.random().toString(36).substring(2, 8); // isolate styles to prevent CSS clashes
    
    if (anim === 'spin') {
      animStyle = `@keyframes spin-${uid} { 100% { transform: rotate(360deg); } } .sednicon-anim { transform-origin: center; animation: spin-${uid} 2s linear infinite; }`;
    } else if (anim === 'pulse') {
      animStyle = `@keyframes pulse-${uid} { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.85); opacity: 0.7; } } .sednicon-anim { transform-origin: center; animation: pulse-${uid} 1.5s ease-in-out infinite; }`;
    } else if (anim === 'bounce') {
      animStyle = `@keyframes bounce-${uid} { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20%); } } .sednicon-anim { animation: bounce-${uid} 1s cubic-bezier(0.28,0.84,0.42,1) infinite; }`;
    }

    if (animStyle) {
      // Wrap SVG inner content in a group to apply the transform, and prepend the <style> block
      svg = svg.replace(/(<svg[^>]*>)(.*)(<\/svg>)/is, (match, open, content, close) => {
        return `${open}<style>${animStyle}</style><g class="sednicon-anim">${content}</g>${close}`;
      });
    }
  }

  return svg;
}

// ─── ICONIFY FETCHER (With Host Failover) ────────────────────────────────────
async function fetchIconify(prefix, name) {
  for (const host of ICONIFY_HOSTS) {
    try {
      const url = `${host}/${prefix}/${name}.svg`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout per mirror

      const res = await fetch(url, {
        headers: { 'Accept': 'image/svg+xml' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) continue; // Try next mirror if 404 or 5xx
      const text = await res.text();
      if (text.startsWith('<') && text.includes('<svg')) {
        return text;
      }
    } catch {
      // Mirror failed or timed out, loop to next mirror
    }
  }
  return null;
}

// ─── BRAND RESOLVER ─────────────────────────────────────────────────────────
export function brandResolver(q) {
  if (BRAND_ICONS[q]) return { svg: BRAND_ICONS[q], source: 'custom-brand' };
  return null;
}

// ─── ICONIFY RESOLVER ───────────────────────────────────────────────────────
export async function iconifyResolver(q, setHint) {
  let cleanQ = (q || '').toLowerCase().trim();

  // Normalize formatting: underscores and spaces to hyphens
  cleanQ = cleanQ.replace(/[_\s]+/g, '-');

  // Check synonym alias map
  if (KEYWORD_ALIASES[cleanQ]) {
    cleanQ = KEYWORD_ALIASES[cleanQ];
  }

  // Handle explicit set prefix (e.g., "lucide:rocket")
  if (cleanQ.includes(':')) {
    const [prefix, ...rest] = cleanQ.split(':');
    const name = rest.join(':');
    const svg = await fetchIconify(prefix, name);
    return svg ? { svg, source: `iconify:${prefix}` } : null;
  }

  // Handle set hint parameter
  if (setHint) {
    const svg = await fetchIconify(setHint, cleanQ);
    if (svg) return { svg, source: `iconify:${setHint}` };
  }

  // Handle tech/brand sets
  if (BRAND_SET.has(cleanQ)) {
    const svg = await fetchIconify('simple-icons', cleanQ);
    if (svg) return { svg, source: 'iconify:simple-icons' };
  }

  // Probe primary sets in parallel
  const probes = await Promise.all(
    PARALLEL_PROBE_SETS.map(p => fetchIconify(p, cleanQ).then(s => s ? { svg: s, source: `iconify:${p}` } : null))
  );
  const hit = probes.find(r => r);
  if (hit) return hit;

  // Concurrently probe remaining sets
  const remainingSets = FALLBACK_SETS.filter(p => !PARALLEL_PROBE_SETS.includes(p));
  try {
    const fallbackHit = await Promise.any(
      remainingSets.map(p =>
        fetchIconify(p, cleanQ).then(s => s ? { svg: s, source: `iconify:${p}` } : Promise.reject())
      )
    );
    if (fallbackHit) return fallbackHit;
  } catch {
    // Probing failed, proceed to search API
  }

  // Search API fallback for approximate/fuzzy matches
  for (const host of ICONIFY_HOSTS) {
    try {
      const sr = await fetch(`${host}/search?query=${encodeURIComponent(cleanQ)}&limit=1`);
      if (!sr.ok) continue;
      const data = await sr.json();
      const icons = data.icons || [];
      if (!icons.length) break;

      const [sp, sn] = icons[0].split(':');
      const svg = await fetchIconify(sp, sn);
      if (svg) return { svg, source: `iconify:search` };
    } catch {
      // Try next host for search
    }
  }

  return null;
}

// ─── MAIN RESOLVER ──────────────────────────────────────────────────────────
export async function resolveIcon(q, setHint) {
  let result = brandResolver(q);
  if (!result) result = await iconifyResolver(q, setHint);
  if (!result) result = { svg: FALLBACK_SVG, source: 'generic-fallback' };

  result.svg = sanitizeSvg(result.svg);
  return result;
}
