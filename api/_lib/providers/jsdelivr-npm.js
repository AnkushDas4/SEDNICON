/**
 * Sednicon — jsDelivr npm CDN Icon Provider
 * Direct resolution of SVG files from pinned npm packages.
 */

import { registerProvider } from './registry.js';

export const NPM_PACKAGE_MAP = {
  lucide: {
    pkg: 'lucide-static@0.469.0',
    resolvePath: (name) => `/icons/${name}.svg`,
  },
  'simple-icons': {
    pkg: 'simple-icons@14.0.0',
    resolvePath: (name) => `/icons/${name}.svg`,
  },
  tabler: {
    pkg: '@tabler/icons@3.26.0',
    resolvePath: (name, style) => {
      const isFilled = style === 'filled' || style === 'solid';
      return `/icons/${isFilled ? 'filled' : 'outline'}/${name}.svg`;
    },
  },
  heroicons: {
    pkg: 'heroicons@2.2.0',
    resolvePath: (name, style) => {
      const isSolid = style === 'solid' || style === 'fill';
      return `/24/${isSolid ? 'solid' : 'outline'}/${name}.svg`;
    },
  },
  phosphor: {
    pkg: '@phosphor-icons/core@2.1.1',
    resolvePath: (name, style) => {
      if (style === 'fill' || style === 'solid') return `/assets/fill/${name}-fill.svg`;
      if (style === 'duotone') return `/assets/duotone/${name}-duotone.svg`;
      return `/assets/regular/${name}.svg`;
    },
  },
  'bootstrap-icons': {
    pkg: 'bootstrap-icons@1.11.3',
    resolvePath: (name) => `/icons/${name}.svg`,
  },
  bi: {
    pkg: 'bootstrap-icons@1.11.3',
    resolvePath: (name) => `/icons/${name}.svg`,
  },
  feather: {
    pkg: 'feather-icons@4.29.2',
    resolvePath: (name) => `/dist/icons/${name}.svg`,
  },
  octicon: {
    pkg: '@primer/octicons@19.14.0',
    resolvePath: (name) => `/build/svg/${name}-24.svg`,
  },
  octicons: {
    pkg: '@primer/octicons@19.14.0',
    resolvePath: (name) => `/build/svg/${name}-24.svg`,
  },
};

export const jsdelivrNpmProvider = {
  id: 'jsdelivr-npm',
  name: 'jsDelivr npm CDN',
  tier: 2,
  timeoutMs: 1800,

  supports(collection) {
    return Boolean(NPM_PACKAGE_MAP[collection]);
  },

  async resolve(collection, iconName, options = {}) {
    const config = NPM_PACKAGE_MAP[collection];
    if (!config) return null;

    const subPath = config.resolvePath(iconName, options.style);
    const url = `https://cdn.jsdelivr.net/npm/${config.pkg}${subPath}`;

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
          source: `jsdelivr:${collection}`,
        };
      }
    } catch {
      // Return null on network error/timeout to allow fallback to next provider
    }
    return null;
  },
};

registerProvider(jsdelivrNpmProvider);
