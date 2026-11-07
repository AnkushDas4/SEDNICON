/**
 * Sednicon API - Status Endpoint
 * GET /api/status → JSON health check + multi-provider operational telemetry
 */

export const config = { runtime: 'edge' };

import { getAllProvidersHealth } from './_lib/metrics.js';
import { getCacheMetrics } from './_lib/cache.js';

const VERSION = '3.5.0';
const RELEASED = '2026-11-06';

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const startedAt = Date.now();

  // Test primary upstream
  let primaryStatus = 'operational';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://cdn.jsdelivr.net/npm/lucide-static@0.469.0/icons/rocket.svg', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    primaryStatus = res.ok ? 'operational' : 'degraded';
  } catch {
    primaryStatus = 'degraded';
  }

  const latencyMs = Date.now() - startedAt;
  const providerStats = getAllProvidersHealth();
  const cacheStats = getCacheMetrics();

  const dependencies = {
    jsdelivr_npm: primaryStatus,
  };
  for (const p of providerStats) {
    dependencies[p.id] = p.health;
  }

  const overallStatus = primaryStatus === 'operational' ? 'operational' : 'degraded';

  const body = {
    status: overallStatus,
    version: VERSION,
    released: RELEASED,
    timestamp: new Date().toISOString(),
    dependencies,
    cache: cacheStats,
    upstream_check_ms: latencyMs,
    endpoints: {
      render: '/api/render',
      sprite: '/api/sprite',
      status: '/api/status',
      providers_health: '/api/health/providers',
    },
    region: process.env.VERCEL_REGION || 'unknown',
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
