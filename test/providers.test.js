import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { getProvider, listProviders, registerProvider } from '../api/_lib/providers/registry.js';
import { iconifyApiProvider } from '../api/_lib/providers/iconify-api.js';
import { jsdelivrNpmProvider } from '../api/_lib/providers/jsdelivr-npm.js';
import { unpkgNpmProvider } from '../api/_lib/providers/unpkg-npm.js';
import { deviconProvider } from '../api/_lib/providers/devicon.js';
import { svglProvider } from '../api/_lib/providers/svgl.js';
import { cryptoIconsProvider } from '../api/_lib/providers/crypto-icons.js';
import { iconifyJsonProvider } from '../api/_lib/providers/iconify-json.js';

describe('Multi-Provider Resolution Suite', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('Registry lists all required built-in providers', () => {
    const providers = listProviders();
    const ids = providers.map((p) => p.id);
    assert.ok(ids.includes('iconify-api'));
    assert.ok(ids.includes('jsdelivr-npm'));
    assert.ok(ids.includes('unpkg-npm'));
    assert.ok(ids.includes('devicon'));
    assert.ok(ids.includes('svgl'));
    assert.ok(ids.includes('crypto-icons'));
    assert.ok(ids.includes('iconify-json'));
  });

  test('jsDelivr npm provider resolves Lucide, Tabler, Phosphor, Heroicons', async () => {
    globalThis.fetch = async (url) => {
      if (url.includes('lucide-static') && url.includes('rocket.svg')) {
        return new Response('<svg id="lucide-rocket"><path d="M0 0"/></svg>', { status: 200, headers: { 'content-type': 'image/svg+xml' } });
      }
      if (url.includes('@tabler/icons') && url.includes('filled') && url.includes('alarm.svg')) {
        return new Response('<svg id="tabler-alarm-filled"><path d="M0 0"/></svg>', { status: 200, headers: { 'content-type': 'image/svg+xml' } });
      }
      return new Response('Not Found', { status: 404 });
    };

    const resLucide = await jsdelivrNpmProvider.resolve('lucide', 'rocket');
    assert.ok(resLucide);
    assert.ok(resLucide.svg.includes('lucide-rocket'));
    assert.equal(resLucide.source, 'jsdelivr:lucide');

    const resTabler = await jsdelivrNpmProvider.resolve('tabler', 'alarm', { style: 'filled' });
    assert.ok(resTabler);
    assert.ok(resTabler.svg.includes('tabler-alarm-filled'));
  });

  test('unpkg provider resolves npm packages when called', async () => {
    globalThis.fetch = async (url) => {
      if (url.includes('unpkg.com') && url.includes('simple-icons') && url.includes('github.svg')) {
        return new Response('<svg id="unpkg-github"><path d="M0 0"/></svg>', { status: 200, headers: { 'content-type': 'image/svg+xml' } });
      }
      return new Response('Not Found', { status: 404 });
    };

    const res = await unpkgNpmProvider.resolve('simple-icons', 'github');
    assert.ok(res);
    assert.ok(res.svg.includes('unpkg-github'));
    assert.equal(res.source, 'unpkg:simple-icons');
  });

  test('Devicon provider resolves original and plain variants', async () => {
    globalThis.fetch = async (url) => {
      if (url.includes('python-original.svg')) {
        return new Response('<svg id="python-original"><path d="M0 0"/></svg>', { status: 200 });
      }
      if (url.includes('python-plain.svg')) {
        return new Response('<svg id="python-plain"><path d="M0 0"/></svg>', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const orig = await deviconProvider.resolve('devicon', 'python', { style: 'original' });
    assert.ok(orig?.svg.includes('python-original'));

    const plain = await deviconProvider.resolve('devicon', 'python', { style: 'plain' });
    assert.ok(plain?.svg.includes('python-plain'));
  });

  test('SVGL provider resolves light and dark variants from index', async () => {
    const mockSvglIndex = [
      {
        title: 'React',
        route: {
          light: 'https://svgl.app/library/react_light.svg',
          dark: 'https://svgl.app/library/react_dark.svg'
        }
      }
    ];

    globalThis.fetch = async (url) => {
      if (url === 'https://api.svgl.app') {
        return new Response(JSON.stringify(mockSvglIndex), { status: 200 });
      }
      if (url === 'https://svgl.app/library/react_light.svg') {
        return new Response('<svg id="react-light"><path d="M0 0"/></svg>', { status: 200 });
      }
      if (url === 'https://svgl.app/library/react_dark.svg') {
        return new Response('<svg id="react-dark"><path d="M0 0"/></svg>', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const resLight = await svglProvider.resolve('svgl', 'react', { style: 'light' });
    assert.ok(resLight?.svg.includes('react-light'));

    const resDark = await svglProvider.resolve('svgl', 'react', { style: 'dark' });
    assert.ok(resDark?.svg.includes('react-dark'));
  });

  test('Cryptocurrency icons provider resolves color and black styles', async () => {
    globalThis.fetch = async (url) => {
      if (url.includes('svg/color/btc.svg')) {
        return new Response('<svg id="btc-color"><circle/></svg>', { status: 200 });
      }
      if (url.includes('svg/black/btc.svg')) {
        return new Response('<svg id="btc-black"><circle/></svg>', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const resColor = await cryptoIconsProvider.resolve('crypto', 'btc', { style: 'color' });
    assert.ok(resColor?.svg.includes('btc-color'));

    const resBlack = await cryptoIconsProvider.resolve('crypto', 'btc', { style: 'black' });
    assert.ok(resBlack?.svg.includes('btc-black'));
  });

  test('Universal Iconify JSON provider parses collection JSON without Iconify API', async () => {
    const mockJson = {
      prefix: 'lucide',
      icons: {
        rocket: {
          body: '<path d="M12 2L2 22h20L12 2z"/>'
        }
      },
      width: 24,
      height: 24
    };

    globalThis.fetch = async (url) => {
      if (url.includes('@iconify-json/lucide') && url.includes('icons.json')) {
        return new Response(JSON.stringify(mockJson), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const res = await iconifyJsonProvider.resolve('lucide', 'rocket');
    assert.ok(res);
    assert.ok(res.svg.includes('<svg'));
    assert.ok(res.svg.includes('viewBox="0 0 24 24"'));
    assert.ok(res.svg.includes('<path d="M12 2L2 22h20L12 2z"/>'));
    assert.equal(res.source, 'iconify-json:lucide');
  });

  test('Iconify API provider uses host failover', async () => {
    let callCount = 0;
    globalThis.fetch = async (url) => {
      callCount++;
      if (url.includes('api.iconify.design')) {
        // First mirror fails (500)
        return new Response('Server Error', { status: 500 });
      }
      if (url.includes('api.simplesvg.com')) {
        // Second mirror succeeds
        return new Response('<svg id="iconify-success"><path d="M0 0"/></svg>', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const res = await iconifyApiProvider.resolve('material-symbols', 'home');
    assert.ok(res);
    assert.ok(res.svg.includes('iconify-success'));
    assert.equal(callCount, 2);
  });
});
