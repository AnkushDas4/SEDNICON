import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import renderHandler from '../api/render.js';
import spriteHandler from '../api/sprite.js';
import statusHandler from '../api/status.js';
import healthProvidersHandler from '../api/health/providers.js';

describe('Enhanced API Endpoints Suite', () => {
  test('GET /api/render accepts style parameter and returns custom provider headers', async () => {
    const req = new Request('https://sednicon.sednium.com/api/render?q=circle&style=filled&size=32&color=2563eb');
    const res = await renderHandler(req);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'image/svg+xml; charset=utf-8');
    assert.ok(res.headers.get('X-Sednicon-Source'));
    assert.ok(res.headers.get('X-Sednicon-Provider'));
    const svg = await res.text();
    assert.ok(svg.includes('#2563eb'));
    assert.ok(svg.includes('width="32"'));
  });

  test('GET /api/sprite supports query parameter batching', async () => {
    const req = new Request('https://sednicon.sednium.com/api/sprite?icons=github,rocket&size=32&color=ff6600&format=json');
    const res = await spriteHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.icons));
    assert.equal(data.icons.length, 2);
    assert.equal(data.icons[0].q, 'github');
    assert.equal(data.icons[1].q, 'rocket');
  });

  test('POST /api/sprite continues to support JSON symbol sprite output', async () => {
    const req = new Request('https://sednicon.sednium.com/api/sprite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        icons: [{ q: 'github' }, { q: 'rocket' }],
        format: 'symbol',
      }),
    });
    const res = await spriteHandler(req);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'image/svg+xml; charset=utf-8');
    const svg = await res.text();
    assert.ok(svg.includes('<symbol id="github"'));
    assert.ok(svg.includes('<symbol id="rocket"'));
  });

  test('GET /api/status returns provider dependencies and cache metrics', async () => {
    const req = new Request('https://sednicon.sednium.com/api/status');
    const res = await statusHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.status);
    assert.ok(data.version);
    assert.ok(data.dependencies);
    assert.ok(data.cache);
  });

  test('GET /api/health/providers returns operational telemetry without secrets', async () => {
    const req = new Request('https://sednicon.sednium.com/api/health/providers');
    const res = await healthProvidersHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.timestamp);
    assert.ok(Array.isArray(data.providers));
    assert.ok(data.cache);

    // Verify no secret leak
    const jsonStr = JSON.stringify(data);
    assert.ok(!jsonStr.includes('Bearer'));
    assert.ok(!jsonStr.includes('password'));
    assert.ok(!jsonStr.includes('token'));
  });
});
