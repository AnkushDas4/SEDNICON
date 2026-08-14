/**
 * Sednicon API — Per-Account Render API Keys (Task H)
 * POST   /api/account-keys              → { key, id }   (raw key shown once)
 * GET    /api/account-keys              → { keys: [...] }
 * DELETE /api/account-keys { id }       → { revoked: true }
 * Auth required (Bearer JWT)
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

async function hashKey(rawKey) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRawKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `sk_${hex}`;
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

    // ── GET: list keys (never return raw key) ──
    if (request.method === 'GET') {
      // Get active keys
      const keys = await supabaseQuery(
        `/api_keys?user_id=eq.${user.id}&revoked_at=is.null&select=id,label,created_at,monthly_quota&order=created_at.desc`
      );
      return json({ keys: keys ?? [] });
    }

    // ── POST: generate new key ──
    if (request.method === 'POST') {
      const body = await request.json() || {};
      const label = String(body.label || '').slice(0, 100);
      const rawKey = generateRawKey();
      const keyHash = await hashKey(rawKey);

      await supabaseQuery('/api_keys', 'POST', {
        user_id: user.id,
        key_hash: keyHash,
        label: label || null,
      });

      return json({ key: rawKey, label: label || null });
    }

    // ── DELETE: revoke key ──
    if (request.method === 'DELETE') {
      const body = await request.json();
      const { id } = body || {};
      if (!id) return json({ error: 'id is required' }, 400);

      // Only allow revoking your own keys
      const existing = await supabaseQuery(
        `/api_keys?id=eq.${id}&user_id=eq.${user.id}&select=id`
      );
      if (!existing?.length) return json({ error: 'Key not found or not owned by you' }, 404);

      await supabaseQuery(`/api_keys?id=eq.${id}`, 'PATCH', {
        revoked_at: new Date().toISOString(),
      });

      return json({ revoked: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...hdrs, 'Content-Type': 'application/json' },
    });
  }
}