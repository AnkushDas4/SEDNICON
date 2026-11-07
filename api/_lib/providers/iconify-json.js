/**
 * Sednicon — Universal Iconify JSON Fallback Provider
 * Directly retrieves collection JSON packages from npm CDNs (jsDelivr / unpkg)
 * and reconstructs SVG vector code without contacting the Iconify public API.
 */

import { registerProvider } from './registry.js';
import { cacheGet, cacheSet, METADATA_TTL_SEC } from '../cache.js';

// Pinned known-stable versions for common @iconify-json packages
const PINNED_COLLECTION_VERSIONS = {
  lucide: '1.2.14',
  'material-symbols': '1.2.14',
  heroicons: '1.2.14',
  tabler: '1.2.14',
  phosphor: '1.2.14',
  'simple-icons': '1.2.14',
  mdi: '1.2.14',
  fluent: '1.2.14',
  carbon: '1.2.14',
  feather: '1.2.14',
  ri: '1.2.14',
  octicon: '1.2.14',
};

// In-memory collection cache (prefix -> { data, expiresAt })
const jsonCollectionCache = new Map();

async function fetchCollectionJson(prefix, timeoutMs = 2500) {
  const now = Date.now();
  const memHit = jsonCollectionCache.get(prefix);
  if (memHit && now < memHit.expiresAt) {
    return memHit.data;
  }

  const cacheKey = `meta:iconify-json:${prefix}`;
  const cached = await cacheGet(cacheKey);
  if (cached && cached.icons) {
    jsonCollectionCache.set(prefix, { data: cached, expiresAt: now + 300000 }); // 5 min local
    return cached;
  }

  const version = PINNED_COLLECTION_VERSIONS[prefix] || '1.2.14';
  const mirrors = [
    `https://cdn.jsdelivr.net/npm/@iconify-json/${prefix}@${version}/icons.json`,
    `https://unpkg.com/@iconify-json/${prefix}@${version}/icons.json`,
  ];

  for (const url of mirrors) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data && data.icons) {
          jsonCollectionCache.set(prefix, { data, expiresAt: now + 300000 });
          await cacheSet(cacheKey, data, METADATA_TTL_SEC);
          return data;
        }
      }
    } catch {
      // Try next mirror
    }
  }

  return null;
}

export const iconifyJsonProvider = {
  id: 'iconify-json',
  name: 'Universal Iconify JSON Package',
  tier: 3,
  timeoutMs: 2500,

  supports(_collection) {
    return true; // Available for all @iconify-json packages
  },

  async resolve(collection, iconName, options = {}) {
    const data = await fetchCollectionJson(collection, options.timeoutMs || this.timeoutMs);
    if (!data || !data.icons) return null;

    let icon = data.icons[iconName];

    // Check aliases if direct icon is not found
    if (!icon && data.aliases && data.aliases[iconName]) {
      const alias = data.aliases[iconName];
      const targetName = typeof alias === 'string' ? alias : alias.parent;
      if (targetName && data.icons[targetName]) {
        icon = data.icons[targetName];
      }
    }

    if (!icon || !icon.body) return null;

    // Determine coordinate bounding box
    const width = icon.width || data.width || 24;
    const height = icon.height || data.height || 24;
    const left = icon.left || data.left || 0;
    const top = icon.top || data.top || 0;
    const viewBox = `${left} ${top} ${width} ${height}`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${icon.body}</svg>`;

    return {
      svg,
      source: `iconify-json:${collection}`,
    };
  },
};

registerProvider(iconifyJsonProvider);
