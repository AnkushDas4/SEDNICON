/**
 * Sednicon — Shared CORS helper
 */

const CORS_ORIGINS = [
  'https://sednicon.sednium.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

export function getCorsOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin && CORS_ORIGINS.some(o => origin.startsWith(o))) return origin;
  return CORS_ORIGINS[0];
}

export function corsHeaders(request, extra = {}) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin, Accept',
    ...extra,
  };
}