import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { corsHeaders, getCorsOrigin } from '../api/_lib/cors.js';

describe('CORS Headers Helper', () => {
  test('allows public wildcard or requested origin for public CDN API', () => {
    const fakeRequest = { headers: new Map([['origin', 'https://example-external-app.com']]) };
    // Simulated Request object
    fakeRequest.headers.get = (k) => (k.toLowerCase() === 'origin' ? 'https://example-external-app.com' : null);

    const headers = corsHeaders(fakeRequest);
    assert.equal(headers['Access-Control-Allow-Origin'], '*');
  });

  test('includes GET, POST, and OPTIONS in allowed methods', () => {
    const fakeRequest = { headers: { get: () => null } };
    const headers = corsHeaders(fakeRequest);
    assert.ok(headers['Access-Control-Allow-Methods'].includes('GET'));
    assert.ok(headers['Access-Control-Allow-Methods'].includes('POST'));
    assert.ok(headers['Access-Control-Allow-Methods'].includes('OPTIONS'));
  });

  test('merges extra headers properly', () => {
    const fakeRequest = { headers: { get: () => null } };
    const headers = corsHeaders(fakeRequest, { 'X-Custom-Header': '123' });
    assert.equal(headers['X-Custom-Header'], '123');
  });
});
