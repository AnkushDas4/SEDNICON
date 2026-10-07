/**
 * Sednicon — Shared CORS helper
 * Public CDN design API: enables open cross-origin access for all browser clients.
 */

export function getCorsOrigin(_request) {
  return '*';
}

export function corsHeaders(_request, extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    ...extra,
  };
}