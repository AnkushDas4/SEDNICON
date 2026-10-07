import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import renderHandler from '../api/render.js';

describe('Render Endpoint Handler', () => {
  test('handles color with leading hash or URL-encoded hash without resetting to black', async () => {
    const req = new Request('https://sednicon.sednium.com/api/render?q=circle&color=%23ff6600&size=24');
    const res = await renderHandler(req);
    assert.equal(res.status, 200);
    const svg = await res.text();
    assert.ok(svg.includes('#ff6600'), 'SVG should contain #ff6600');
  });

  test('handles color without leading hash', async () => {
    const req = new Request('https://sednicon.sednium.com/api/render?q=circle&color=2563eb&size=24');
    const res = await renderHandler(req);
    assert.equal(res.status, 200);
    const svg = await res.text();
    assert.ok(svg.includes('#2563eb'), 'SVG should contain #2563eb');
  });

  test('returns 204 for OPTIONS preflight with CORS headers', async () => {
    const req = new Request('https://sednicon.sednium.com/api/render', { method: 'OPTIONS' });
    const res = await renderHandler(req);
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  });
});
