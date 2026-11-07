/**
 * Sednicon — unpkg npm CDN Fallback Provider
 * Independent npm package CDN fallback for resilience against jsDelivr outages.
 */

import { registerProvider } from './registry.js';
import { NPM_PACKAGE_MAP } from './jsdelivr-npm.js';

export const unpkgNpmProvider = {
  id: 'unpkg-npm',
  name: 'unpkg npm CDN',
  tier: 3,
  timeoutMs: 2500,

  supports(collection) {
    return Boolean(NPM_PACKAGE_MAP[collection]);
  },

  async resolve(collection, iconName, options = {}) {
    const config = NPM_PACKAGE_MAP[collection];
    if (!config) return null;

    const subPath = config.resolvePath(iconName, options.style);
    const url = `https://unpkg.com/${config.pkg}${subPath}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

      const res = await fetch(url, {
        headers: { 'Accept': 'image/svg+xml' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 404) return null;
      if (!res.ok) return null;

      const text = await res.text();
      if (text.startsWith('<') && text.includes('<svg')) {
        return {
          svg: text,
          source: `unpkg:${collection}`,
        };
      }
    } catch {
      // Fallback
    }
    return null;
  },
};

registerProvider(unpkgNpmProvider);
