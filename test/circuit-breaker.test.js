import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CircuitBreaker,
  getCircuitBreaker,
  resetCircuitBreakers
} from '../api/_lib/circuit-breaker.js';
import {
  recordProviderExecution,
  getProviderStats,
  getAllProvidersHealth,
  resetMetrics
} from '../api/_lib/metrics.js';

describe('Circuit Breaker & Provider Health Metrics', () => {
  beforeEach(() => {
    resetCircuitBreakers();
    resetMetrics();
  });

  test('starts in CLOSED state and allows attempts', () => {
    const cb = new CircuitBreaker('test-provider', { failureThreshold: 3 });
    assert.equal(cb.getState(), 'CLOSED');
    assert.equal(cb.canAttempt(), true);
  });

  test('trips to OPEN after reaching failure threshold', () => {
    const cb = new CircuitBreaker('test-provider', { failureThreshold: 3, cooldownMs: 1000 });
    cb.recordFailure('Network error 1');
    assert.equal(cb.getState(), 'CLOSED');
    cb.recordFailure('Network error 2');
    assert.equal(cb.getState(), 'CLOSED');
    cb.recordFailure('Network error 3');
    assert.equal(cb.getState(), 'OPEN');
    assert.equal(cb.canAttempt(), false);
  });

  test('transitions to HALF_OPEN after cooldown and recovers on success', async () => {
    const cb = new CircuitBreaker('test-provider', { failureThreshold: 2, cooldownMs: 20 });
    cb.recordFailure('Fail 1');
    cb.recordFailure('Fail 2');
    assert.equal(cb.getState(), 'OPEN');

    // Wait for cooldown
    await new Promise((r) => setTimeout(r, 25));
    assert.equal(cb.canAttempt(), true);
    assert.equal(cb.getState(), 'HALF_OPEN');

    // Successful probe restores to CLOSED
    cb.recordSuccess(45);
    assert.equal(cb.getState(), 'CLOSED');
    assert.equal(cb.canAttempt(), true);
  });

  test('re-opens circuit if probe fails in HALF_OPEN', async () => {
    const cb = new CircuitBreaker('test-provider', { failureThreshold: 2, cooldownMs: 20 });
    cb.recordFailure('Fail 1');
    cb.recordFailure('Fail 2');
    assert.equal(cb.getState(), 'OPEN');

    await new Promise((r) => setTimeout(r, 25));
    assert.equal(cb.canAttempt(), true);
    assert.equal(cb.getState(), 'HALF_OPEN');

    // Failed probe trips back to OPEN
    cb.recordFailure('Probe failed');
    assert.equal(cb.getState(), 'OPEN');
  });

  test('metrics record latencies, counts, and rolling averages correctly', () => {
    recordProviderExecution('provider-a', { success: true, latencyMs: 50 });
    recordProviderExecution('provider-a', { success: true, latencyMs: 70 });
    recordProviderExecution('provider-a', { success: false, latencyMs: 100, isTimeout: true, error: 'Timeout' });

    const stats = getProviderStats('provider-a');
    assert.equal(stats.totalRequests, 3);
    assert.equal(stats.successCount, 2);
    assert.equal(stats.failureCount, 1);
    assert.equal(stats.timeoutCount, 1);
    assert.equal(Math.round(stats.avgLatencyMs), 73);
    assert.equal(Math.round(stats.successRate * 100), 67);
  });

  test('health summary excludes credentials and secrets', () => {
    recordProviderExecution('jsdelivr-npm', { success: true, latencyMs: 30 });
    const health = getAllProvidersHealth();
    assert.ok(Array.isArray(health));
    const entry = health.find((h) => h.id === 'jsdelivr-npm');
    assert.ok(entry);
    assert.equal(entry.health, 'operational');
    assert.equal(entry.circuitState, 'CLOSED');
    assert.equal(entry.apiKey, undefined);
    assert.equal(entry.token, undefined);
  });
});
