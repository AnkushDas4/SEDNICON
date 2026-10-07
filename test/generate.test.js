import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import generateHandler from '../api/generate.js';

describe('Generate Endpoint Handler', () => {
  test('returns 400 with CORS and JSON headers when apiKey is missing', async () => {
    const req = new Request('https://sednicon.sednium.com/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'rocket', provider: 'openai' }),
    });

    const res = await generateHandler(req);
    assert.equal(res.status, 400);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
    assert.ok(res.headers.get('Content-Type')?.includes('application/json'));

    const data = await res.json();
    assert.equal(data.error, 'API Key is required.');
  });

  test('returns 400 when provider is unsupported', async () => {
    const req = new Request('https://sednicon.sednium.com/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'rocket', provider: 'unknown-provider', apiKey: 'test-key' }),
    });

    const res = await generateHandler(req);
    assert.equal(res.status, 400);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
    const data = await res.json();
    assert.ok(data.error.includes('Unsupported AI provider'));
  });
});
