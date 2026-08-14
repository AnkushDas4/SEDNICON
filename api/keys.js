/**
 * Sednicon API - Encrypted Key Management
 * GET    /api/keys?provider=gemini   → { hasKey: bool }
 * DELETE /api/keys?provider=gemini   → { deleted: true }
 */

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const CORS_ORIGINS = [
  'https://sednicon.sednium.com',
  'http://localhost:3000',
  'http://localhost:5173',
];
function getCorsOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin && CORS_ORIGINS.some(o => origin.startsWith(o))) return origin;
  return CORS_ORIGINS[0];
}
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function verifyJWT(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

async function supabaseQuery(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default async function handler(request) {
  const corsHeaders = { ...CORS, 'Access-Control-Allow-Origin': getCorsOrigin(request) };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    const user = await verifyJWT(auth.slice(7));
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    if (!provider) return new Response(JSON.stringify({ error: 'provider required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

    if (request.method === 'GET') {
      const rows = await supabaseQuery(`/user_keys?user_id=eq.${user.id}&provider=eq.${provider}&select=provider`);
      return new Response(JSON.stringify({ hasKey: rows?.length > 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE') {
      await supabaseQuery(`/user_keys?user_id=eq.${user.id}&provider=eq.${provider}`, 'DELETE');
      return new Response(JSON.stringify({ deleted: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
}
