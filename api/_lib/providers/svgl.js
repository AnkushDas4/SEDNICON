/**
 * Sednicon — SVGL Provider
 * Resolves curated tech logos with light and dark mode variants.
 */

import { registerProvider } from './registry.js';
import { cacheGet, cacheSet, METADATA_TTL_SEC } from '../cache.js';

const SVGL_INDEX_CACHE_KEY = 'meta:svgl:index';

let inMemorySvglCache = null;
let svglCacheExpiresAt = 0;

async function getSvglCatalog(timeoutMs = 2500) {
  const now = Date.now();
  if (inMemorySvglCache && now < svglCacheExpiresAt) {
    return inMemorySvglCache;
  }

  // Check shared L1/L2 cache
  const cached = await cacheGet(SVGL_INDEX_CACHE_KEY);
  if (cached && Array.isArray(cached)) {
    inMemorySvglCache = cached;
    svglCacheExpiresAt = now + 60000; // Keep local copy fresh for 1 min
    return cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch('https://api.svgl.app', { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        inMemorySvglCache = data;
        svglCacheExpiresAt = now + 60000;
        await cacheSet(SVGL_INDEX_CACHE_KEY, data, METADATA_TTL_SEC);
        return data;
      }
    }
  } catch {
    // If fetching fails, return stale memory cache if available
    if (inMemorySvglCache) return inMemorySvglCache;
  }

  return [];
}

export const svglProvider = {
  id: 'svgl',
  name: 'SVGL',
  tier: 4,
  timeoutMs: 2500,

  supports(collection) {
    return collection === 'svgl';
  },

  async resolve(collection, iconName, options = {}) {
    const catalog = await getSvglCatalog(options.timeoutMs || this.timeoutMs);
    if (!catalog || !catalog.length) return null;

    const cleanQ = iconName.toLowerCase().replace(/[-_\s]+/g, '');
    const entry = catalog.find((item) => {
      const titleClean = (item.title || '').toLowerCase().replace(/[-_\s]+/g, '');
      return titleClean === cleanQ || (item.id !== undefined && String(item.id) === iconName);
    });

    if (!entry || !entry.route) return null;

    let targetUrl = '';
    if (typeof entry.route === 'string') {
      targetUrl = entry.route;
    } else if (typeof entry.route === 'object') {
      if (options.style === 'dark' && entry.route.dark) {
        targetUrl = entry.route.dark;
      } else {
        targetUrl = entry.route.light || entry.route.dark || '';
      }
    }

    if (!targetUrl) return null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

      const res = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('<') && text.includes('<svg')) {
          return {
            svg: text,
            source: `svgl:${entry.title || iconName}`,
          };
        }
      }
    } catch {
      // Return null
    }

    return null;
  },
};

registerProvider(svglProvider);
