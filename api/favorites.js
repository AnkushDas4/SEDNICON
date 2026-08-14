/**
 * Sednicon API — User Favorites (Task G)
 * GET    /api/favorites                  → { favorites: [...] }
 * POST   /api/favorites { iconRef, color, size } → { added: true }
 * DELETE /api/favorites { iconRef }       → { removed: true }
 * Auth required (Bearer JWT from Supabase)
 */

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

import { corsHeaders } from './_lib/cors.js';

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
      'Prefer': method === 'POST' ? 'return=representation' : '',
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default async function handler(request) {
  const hdrs = corsHeaders(request, { 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: hdrs });

  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...hdrs, 'Content-Type': 'application/json' },
  });

  try {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);
    const user = await verifyJWT(auth.slice(7));

    // ── GET: list favorites ──
    if (request.method === 'GET') {
      const favs = await supabaseQuery(
        `/user_favorites?user_id=eq.${user.id}&select=icon_ref,color,size,created_at&order=created_at.desc`
      );
      return json({ favorites: favs ?? [] });
    }

    // ── POST: add favorite ──
    if (request.method === 'POST') {
      const body = await request.json();
      const { iconRef, color, size } = body || {};
      if (!iconRef) return json({ error: 'iconRef is required' }, 400);

      // Use on-conflict-do-nothing for idempotency
      await supabaseQuery('/user_favorites', 'POST', {
        user_id: user.id,
        icon_ref: String(iconRef).trim(),
        color: color || null,
        size: size ? parseInt(size) : null,
      });

      return json({ added: true });
    }

    // ── DELETE: remove favorite ──
    if (request.method === 'DELETE') {
      const body = await request.json();
      const { iconRef } = body || {};
      if (!iconRef) return json({ error: 'iconRef is required' }, 400);

      const result = await supabaseQuery(
        `/user_favorites?icon_ref=eq.${encodeURIComponent(String(iconRef))}&user_id=eq.${user.id}`,
        'DELETE'
      );
      return json({ removed: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...hdrs, 'Content-Type': 'application/json' },
    });
  }
}