/**
 * Sednicon — Cryptocurrency Icons Provider
 * Direct resolution of crypto tokens with color, black, white, and icon variants.
 */

import { registerProvider } from './registry.js';

const CRYPTO_VERSION = '0.18.1';

const CRYPTO_TICKER_MAP = {
  bitcoin: 'btc',
  ethereum: 'eth',
  solana: 'sol',
  dogecoin: 'doge',
  cardano: 'ada',
  tether: 'usdt',
  ripple: 'xrp',
  litecoin: 'ltc',
  polkadot: 'dot',
  avalanche: 'avax',
  chainlink: 'link',
  uniswap: 'uni',
  monero: 'xmr',
  binance: 'bnb',
  stellar: 'xlm',
  cosmos: 'atom',
};

export const cryptoIconsProvider = {
  id: 'crypto-icons',
  name: 'Cryptocurrency Icons',
  tier: 4,
  timeoutMs: 2000,

  supports(collection) {
    return collection === 'crypto' || collection === 'cryptocurrency' || collection === 'cryptocurrency-icons';
  },

  async resolve(collection, iconName, options = {}) {
    const validStyles = new Set(['color', 'black', 'white', 'icon']);
    const style = validStyles.has(options.style) ? options.style : 'color';
    let cleanName = iconName.toLowerCase().trim();
    if (CRYPTO_TICKER_MAP[cleanName]) {
      cleanName = CRYPTO_TICKER_MAP[cleanName];
    }

    const url = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@${CRYPTO_VERSION}/svg/${style}/${cleanName}.svg`;

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
            source: `crypto:${cleanName}`,
          };
        }
      }
    } catch {
      // Fallback
    }

    return null;
  },
};

registerProvider(cryptoIconsProvider);
