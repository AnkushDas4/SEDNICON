import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { resolveWithOrchestration, getOrchestratorCandidates } from '../api/_lib/orchestrator.js';
import { getCircuitBreaker, resetCircuitBreakers } from '../api/_lib/circuit-breaker.js';
import { resetMetrics } from '../api/_lib/metrics.js';

describe('Orchestrator Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetCircuitBreakers();
    resetMetrics();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('selects prioritized candidates based on collection', () => {
    const lucideCandidates = getOrchestratorCandidates('lucide');
    assert.equal(lucideCandidates[0].id, 'jsdelivr-npm');

    const deviconCandidates = getOrchestratorCandidates('devicon');
    assert.equal(deviconCandidates[0].id, 'devicon');

    const cryptoCandidates = getOrchestratorCandidates('crypto');
    assert.equal(cryptoCandidates[0].id, 'crypto-icons');

    const svglCandidates = getOrchestratorCandidates('svgl');
    assert.equal(svglCandidates[0].id, 'svgl');
  });

  test('resolves from primary provider immediately when healthy', async () => {
    globalThis.fetch = async (url) => {
      if (url.includes('lucide-static') && url.includes('rocket.svg')) {
        return new Response('<svg id="primary-lucide"><path d="M0 0"/></svg>', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const res = await resolveWithOrchestration('lucide', 'rocket');
    assert.ok(res);
    assert.ok(res.svg.includes('primary-lucide'));
    assert.equal(res.provider, 'jsdelivr-npm');
  });

  test('hedges to secondary provider when primary delays beyond hedge delay', async () => {
    globalThis.fetch = async (url) => {
      if (url.includes('jsdelivr.net') && url.includes('lucide-static')) {
        // Slow primary provider
        await new Promise((r) => setTimeout(r, 600));
        return new Response('<svg id="slow-primary"/>', { status: 200 });
      }
      if (url.includes('unpkg.com') && url.includes('lucide-static')) {
        // Fast secondary provider
        return new Response('<svg id="fast-secondary"><path d="M0 0"/></svg>', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const res = await resolveWithOrchestration('lucide', 'rocket', { hedgeDelayMs: 50 });
    assert.ok(res);
    assert.ok(res.svg.includes('fast-secondary'));
    assert.equal(res.provider, 'unpkg-npm');
  });

  test('coalesces concurrent requests for the same icon', async () => {
    let networkCalls = 0;
    globalThis.fetch = async (url) => {
      networkCalls++;
      await new Promise((r) => setTimeout(r, 50));
      return new Response('<svg id="coalesced"><path d="M0 0"/></svg>', { status: 200 });
    };

    // Trigger 5 concurrent requests at once
    const promises = Array.from({ length: 5 }, () => resolveWithOrchestration('lucide', 'sparkles'));
    const results = await Promise.all(promises);

    for (const r of results) {
      assert.ok(r.svg.includes('coalesced'));
    }
    // Only 1 upstream network request made for all 5 concurrent calls
    assert.equal(networkCalls, 1);
  });

  test('skips providers whose circuit is OPEN', async () => {
    // Force jsdelivr circuit to OPEN
    const cb = getCircuitBreaker('jsdelivr-npm');
    cb.state = 'OPEN';
    cb.lastFailureTime = Date.now();

    globalThis.fetch = async (url) => {
      if (url.includes('jsdelivr.net')) {
        throw new Error('Should not have called open circuit!');
      }
      if (url.includes('unpkg.com')) {
        return new Response('<svg id="fallback-after-circuit"><path d="M0 0"/></svg>', { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const res = await resolveWithOrchestration('lucide', 'rocket');
    assert.ok(res);
    assert.ok(res.svg.includes('fallback-after-circuit'));
  });
});
