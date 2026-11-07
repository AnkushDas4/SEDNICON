/**
 * Sednicon — Devicon Provider
 * Resolves developer, tech stack, and programming language icons with original/plain variants.
 */

import { registerProvider } from './registry.js';

const DEVICON_VERSION = 'v2.16.0';

export const deviconProvider = {
  id: 'devicon',
  name: 'Devicon',
  tier: 4,
  timeoutMs: 2000,

  supports(collection) {
    return collection === 'devicon' || collection === 'devicons';
  },

  async resolve(collection, iconName, options = {}) {
    const style = options.style === 'plain' ? 'plain' : 'original';
    const altStyle = style === 'original' ? 'plain' : 'original';

    const urls = [
      `https://cdn.jsdelivr.net/gh/devicons/devicon@${DEVICON_VERSION}/icons/${iconName}/${iconName}-${style}.svg`,
      `https://cdn.jsdelivr.net/gh/devicons/devicon@${DEVICON_VERSION}/icons/${iconName}/${iconName}-${altStyle}.svg`,
    ];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.timeoutMs || this.timeoutMs);

        const res = await fetch(url, {
          headers: { 'Accept': 'image/svg+xml' },
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          const text = await res.text();
          if (text.startsWith('<') && text.includes('<svg')) {
            return {
              svg: text,
              source: `devicon:${iconName}`,
            };
          }
        }
      } catch {
        // Fallback
      }
    }

    return null;
  },
};

registerProvider(deviconProvider);
