/**
 * Sednicon — Provider Health & Telemetry Metrics
 * Rolling performance statistics, latency tracking, and safe operational summaries.
 */

import { getCircuitBreaker } from './circuit-breaker.js';

const metrics = new Map();

function getOrCreateRecord(providerId) {
  let record = metrics.get(providerId);
  if (!record) {
    record = {
      id: providerId,
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      timeoutCount: 0,
      totalLatencyMs: 0,
      recentLatencies: [],
      lastSuccess: null,
      lastFailure: null,
      lastFailureReason: null,
    };
    metrics.set(providerId, record);
  }
  return record;
}

export function recordProviderExecution(providerId, { success, latencyMs = 0, isTimeout = false, error = null }) {
  const record = getOrCreateRecord(providerId);
  const cb = getCircuitBreaker(providerId);

  record.totalRequests++;
  record.totalLatencyMs += latencyMs;
  record.recentLatencies.push(latencyMs);
  if (record.recentLatencies.length > 20) {
    record.recentLatencies.shift();
  }

  const nowIso = new Date().toISOString();

  if (success) {
    record.successCount++;
    record.lastSuccess = nowIso;
    cb.recordSuccess(latencyMs);
  } else {
    record.failureCount++;
    if (isTimeout) record.timeoutCount++;
    record.lastFailure = nowIso;
    record.lastFailureReason = error ? String(error).slice(0, 100) : 'Unknown failure';
    cb.recordFailure(error);
  }
}

export function getProviderStats(providerId) {
  const record = getOrCreateRecord(providerId);
  const cb = getCircuitBreaker(providerId);
  const avgLatency = record.totalRequests > 0 ? record.totalLatencyMs / record.totalRequests : 0;
  const successRate = record.totalRequests > 0 ? record.successCount / record.totalRequests : 1.0;

  return {
    id: record.id,
    circuitState: cb.getState(),
    totalRequests: record.totalRequests,
    successCount: record.successCount,
    failureCount: record.failureCount,
    timeoutCount: record.timeoutCount,
    avgLatencyMs: Math.round(avgLatency * 10) / 10,
    successRate: Math.round(successRate * 100) / 100,
    lastSuccess: record.lastSuccess,
    lastFailure: record.lastFailure,
    lastFailureReason: record.lastFailureReason,
  };
}

export function getAllProvidersHealth() {
  const results = [];
  for (const [id] of metrics.entries()) {
    const stats = getProviderStats(id);
    let health = 'operational';
    if (stats.circuitState === 'OPEN') {
      health = 'unhealthy';
    } else if (stats.circuitState === 'HALF_OPEN' || stats.successRate < 0.8) {
      health = 'degraded';
    }

    results.push({
      id: stats.id,
      health,
      circuitState: stats.circuitState,
      totalRequests: stats.totalRequests,
      successRate: stats.successRate,
      avgLatencyMs: stats.avgLatencyMs,
      lastSuccess: stats.lastSuccess,
      lastFailure: stats.lastFailure,
    });
  }
  return results;
}

export function resetMetrics() {
  metrics.clear();
}
