import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, cacheGet, cacheSet, resetState } from '../api/_lib/redis.js';

describe('Rate Limiter & Cache', () => {
  beforeEach(() => {
    if (typeof resetState === 'function') resetState();
  });

  test('increments counter with weights', async () => {
    const ip = '192.168.1.1';
    // Single request (weight 1)
    const allowed1 = await checkRateLimit(ip, 1);
    assert.equal(allowed1, true);

    // Batch request with weight 100
    const allowed2 = await checkRateLimit(ip, 100);
    assert.equal(allowed2, true);

    // Another batch request with weight 30 (1 + 100 + 30 = 131 > 120 limit)
    const allowed3 = await checkRateLimit(ip, 30);
    assert.equal(allowed3, false);
  });

  test('caches and retrieves items', async () => {
    await cacheSet('icon:rocket', { svg: '<svg></svg>', source: 'test' });
    const hit = await cacheGet('icon:rocket');
    assert.deepEqual(hit, { svg: '<svg></svg>', source: 'test' });

    const miss = await cacheGet('icon:nonexistent');
    assert.equal(miss, null);
  });
});
