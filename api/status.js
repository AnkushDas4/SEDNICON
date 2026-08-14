/**
 * Sednicon API - Status Endpoint
 * GET /api/status → JSON health check + version info
 */

export const config = { runtime: 'edge' };

const VERSION = '3.0.0';
const RELEASED = '2026-06-14';

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

  // Quick upstream health check against Iconify (with timeout)
  let iconifyStatus = 'unknown';
  let dbStatus = 'unknown';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://api.iconify.design/material-symbols/home.svg', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    iconifyStatus = res.ok ? 'operational' : 'degraded';
  } catch {
    iconifyStatus = 'unreachable';
  }

  // Quick Supabase check — use anon key, not service key
  try {
    const dbRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/icons?limit=1`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
    });
    dbStatus = dbRes.ok ? 'operational' : 'degraded';
  } catch {
    dbStatus = 'unreachable';
  }

  const latencyMs = Date.now() - startedAt;

  const body = {
    status: iconifyStatus === 'operational' && dbStatus === 'operational' ? 'operational' : 'degraded',
    version: VERSION,
    released: RELEASED,
    timestamp: new Date().toISOString(),
    dependencies: {
      iconify: iconifyStatus,
      database: dbStatus,
    },
    upstream_check_ms: latencyMs,
    endpoints: {
      render: '/api/render',
      status: '/api/status',
    },
    region: process.env.VERCEL_REGION || 'unknown',
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: iconifyStatus === 'unreachable' ? 503 : 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
