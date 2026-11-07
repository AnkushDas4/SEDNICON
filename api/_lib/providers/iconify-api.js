/**
 * Sednicon — Iconify API Provider (with Host Failover)
 * Connects to Iconify's public CDN cluster with mirror failover.
 */

import { registerProvider } from './registry.js';

export const ICONIFY_HOSTS = [
  'https://api.iconify.design',
  'https://api.simplesvg.com',
  'https://api.unisvg.com',
];

export const iconifyApiProvider = {
  id: 'iconify-api',
  name: 'Iconify API Cluster',
  tier: 3,
  timeoutMs: 2000,

  supports(_collection) {
    return true; // Iconify supports 150+ sets
  },

  async resolve(collection, iconName, options = {}) {
    for (const host of ICONIFY_HOSTS) {
      try {
        const url = `${host}/${collection}/${iconName}.svg`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

        const res = await fetch(url, {
          headers: { 'Accept': 'image/svg+xml' },
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.status === 404) return null; // Icon does not exist in set; don't hammer other mirrors
        if (!res.ok) continue; // Try next mirror if 5xx

        const text = await res.text();
        if (text.startsWith('<') && text.includes('<svg')) {
          return {
            svg: text,
            source: `iconify:${collection}`,
          };
        }
      } catch {
        // Next mirror
      }
    }
    return null;
  },
};

registerProvider(iconifyApiProvider);
