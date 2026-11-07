/**
 * Sednicon — Bulletproof Multi-Provider Icon Resolution Pipeline
 * Coordinates multi-provider orchestration, brand icons, alias normalization, and security sanitization.
 */

import { sanitizeSvg, validateSvg } from './svg-sanitizer.js';
import { svgTransformer } from './svg-transformer.js';
import { resolveWithOrchestration } from './orchestrator.js';

export { sanitizeSvg, validateSvg, svgTransformer };

// ─── 1. HOSTS & FALLBACKS ───────────────────────────────────────────────────
export const ICONIFY_HOSTS = [
  'https://api.iconify.design',
  'https://api.simplesvg.com',
  'https://api.unisvg.com',
];

export const BRAND_ICONS = {
  google: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.98h5.36c-.28 1.6-1.65 4.38-5.36 4.38-3.23 0-5.85-2.65-5.85-5.96s2.62-5.96 5.85-5.96c1.83 0 3.14.78 3.84 1.44l2.25-2.28C16.7 4.29 14.54 3.5 12.18 3.5c-5.18 0-9.38 4.2-9.38 9.38s4.2 9.38 9.38 9.38c5.4 0 8.98-3.8 8.98-9.14 0-.74-.08-1.42-.16-1.92z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.8 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02 1.42-.4 2.92-.4 4.34 0 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>',
};

// Common keyword aliases to normalize naming differences across sets
export const KEYWORD_ALIASES = {
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
  'bitcoin','btc','ethereum','eth','solana','sol','dogecoin','cardano',
  'tether','usdt','ripple','xrp','binance','bnb','coinbase',
]);

export const FALLBACK_SETS = [
  'material-symbols', 'lucide', 'heroicons', 'tabler', 'phosphor',
  'mdi', 'fluent', 'carbon', 'ion', 'feather',
  'simple-icons', 'game-icons', 'logos', 'skill-icons',
  'flat-color-icons', 'emojione',
];
export const PARALLEL_PROBE_SETS = ['material-symbols', 'lucide', 'heroicons'];

export const FALLBACK_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>';

// ─── BRAND RESOLVER ─────────────────────────────────────────────────────────
export function brandResolver(q) {
  if (BRAND_ICONS[q]) return { svg: BRAND_ICONS[q], source: 'custom-brand', provider: 'custom-brand' };
  return null;
}

// ─── ICONIFY RESOLVER (COMPATIBILITY WRAPPER) ───────────────────────────────
export async function iconifyResolver(q, setHint) {
  return resolveIcon(q, setHint);
}

// ─── MAIN RESOLVER ──────────────────────────────────────────────────────────
export async function resolveIcon(q, setHint, options = {}) {
  // 1. Direct custom brand match
  let result = brandResolver(q);
  if (result) {
    result.svg = sanitizeSvg(result.svg);
    return result;
  }

  // 2. Normalize query
  let cleanQ = (q || '').toLowerCase().trim();
  cleanQ = cleanQ.replace(/[_\s]+/g, '-');
  if (KEYWORD_ALIASES[cleanQ]) {
    cleanQ = KEYWORD_ALIASES[cleanQ];
  }

  // 3. Explicit set prefix (e.g. "lucide:rocket", "devicon:python", "crypto:btc")
  if (cleanQ.includes(':')) {
    const [prefix, ...rest] = cleanQ.split(':');
    const name = rest.join(':');
    const orchestrated = await resolveWithOrchestration(prefix, name, options);
    if (orchestrated) {
      return {
        svg: sanitizeSvg(orchestrated.svg),
        source: orchestrated.source,
        provider: orchestrated.provider,
      };
    }
  }

  // 4. Set hint parameter
  if (setHint) {
    const orchestrated = await resolveWithOrchestration(setHint, cleanQ, options);
    if (orchestrated) {
      return {
        svg: sanitizeSvg(orchestrated.svg),
        source: orchestrated.source,
        provider: orchestrated.provider,
      };
    }
  }

  // 5. Tech / brand icons
  if (BRAND_SET.has(cleanQ)) {
    for (const brandCol of ['simple-icons', 'crypto', 'devicon', 'svgl']) {
      const orchestrated = await resolveWithOrchestration(brandCol, cleanQ, options);
      if (orchestrated) {
        return {
          svg: sanitizeSvg(orchestrated.svg),
          source: orchestrated.source,
          provider: orchestrated.provider,
        };
      }
    }
  }

  // 6. Multi-set probing in parallel across primary sets (resolves as soon as any set succeeds)
  const hit = await new Promise((resolve) => {
    let pending = PARALLEL_PROBE_SETS.length;
    let found = false;

    for (const p of PARALLEL_PROBE_SETS) {
      resolveWithOrchestration(p, cleanQ, options)
        .then((res) => {
          if (res && res.svg && !found) {
            found = true;
            resolve(res);
          }
        })
        .catch(() => {})
        .finally(() => {
          pending--;
          if (pending === 0 && !found) {
            resolve(null);
          }
        });
    }
  });

  if (hit) {
    return {
      svg: sanitizeSvg(hit.svg),
      source: hit.source,
      provider: hit.provider,
    };
  }

  // 7. Sequentially check fallback sets
  const remainingSets = FALLBACK_SETS.filter((p) => !PARALLEL_PROBE_SETS.includes(p));
  for (const set of remainingSets) {
    const orchestrated = await resolveWithOrchestration(set, cleanQ, options);
    if (orchestrated) {
      return {
        svg: sanitizeSvg(orchestrated.svg),
        source: orchestrated.source,
        provider: orchestrated.provider,
      };
    }
  }

  // 8. Controlled fallback placeholder if not found anywhere
  return {
    svg: sanitizeSvg(FALLBACK_SVG),
    source: 'generic-fallback',
    provider: 'fallback',
  };
}
