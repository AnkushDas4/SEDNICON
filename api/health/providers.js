/**
 * Sednicon — Provider Health Endpoint
 * GET /api/health/providers
 * Returns operational status, latency metrics, and circuit breaker states for all upstream providers.
 */

export const config = { runtime: 'edge' };

import { getAllProvidersHealth } from '../_lib/metrics.js';
import { getCacheMetrics } from '../_lib/cache.js';
import { corsHeaders } from '../_lib/cors.js';

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, { 'Access-Control-Max-Age': '86400' }),
    });
  }

  const providers = getAllProvidersHealth();
  const cache = getCacheMetrics();

  const hasDegraded = providers.some((p) => p.health === 'degraded' || p.health === 'unhealthy');

  const responsePayload = {
    status: hasDegraded ? 'degraded' : 'operational',
    timestamp: new Date().toISOString(),
    providers,
    cache,
  };

  return new Response(JSON.stringify(responsePayload, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
