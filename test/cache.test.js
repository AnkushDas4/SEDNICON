import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  cacheGet,
  cacheSet,
  cacheSetNegative,
  checkRateLimit,
  resetCacheState,
  getCacheMetrics
} from '../api/_lib/cache.js';

describe('Two-Tier Cache & Rate Limiter', () => {
  beforeEach(() => {
    resetCacheState();
  });

  test('caches and retrieves items in L1', async () => {
    await cacheSet('test:icon:1', { svg: '<svg id="1"/>', source: 'test' });
    const hit = await cacheGet('test:icon:1');
    assert.deepEqual(hit, { svg: '<svg id="1"/>', source: 'test' });

    const miss = await cacheGet('test:nonexistent');
    assert.equal(miss, null);
  });

  test('respects TTL expiration in L1', async () => {
    // 1 millisecond TTL
    await cacheSet('test:expiring', { svg: '<svg/>' }, 0.001);
    await new Promise((r) => setTimeout(r, 10));
    const hit = await cacheGet('test:expiring');
    assert.equal(hit, null);
  });

  test('handles negative cache with confirmed missing entries', async () => {
    await cacheSetNegative('test:missing:icon', 1);
    const hit = await cacheGet('test:missing:icon');
    assert.deepEqual(hit, { missing: true });
  });

  test('enforces rate limits accurately with weights', async () => {
    const ip = '10.0.0.1';
    assert.equal(await checkRateLimit(ip, 10), true);
    assert.equal(await checkRateLimit(ip, 100), true);
    // 10 + 100 + 20 = 130 > 120
    assert.equal(await checkRateLimit(ip, 20), false);
  });

  test('reports cache metrics safely without leaking secrets', () => {
    const metrics = getCacheMetrics();
    assert.equal(typeof metrics.l1Items, 'number');
    assert.ok(['connected', 'disabled', 'unreachable'].includes(metrics.l2Status));
    assert.equal(metrics.token, undefined);
    assert.equal(metrics.url, undefined);
  });
});
