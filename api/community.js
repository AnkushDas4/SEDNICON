/**
 * Sednicon API - Community Icons
 * GET  /api/community?page=0&sort=latest|likes&q=search   → list published icons
 * POST /api/community { iconId }                           → publish icon to community
 * POST /api/community?action=like    { iconId }              → like an icon (auth required)
 * DELETE /api/community?action=like  { iconId }              → unlike an icon (auth required)
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

function sanitizeSearch(q) {
  // Strip PostgREST-special characters to prevent injection
  return (q||'').replace(/[%*<>]/g, '').trim();
}

export default async function handler(request) {
  const corsHdrs = corsHeaders(request, { 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHdrs });

  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...corsHdrs, 'Content-Type': 'application/json' },
  });

  try {
    // ── GET: List icons + like check ──
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const page = Math.max(0, parseInt(searchParams.get('page') || '0'));
      const sort = searchParams.get('sort') === 'likes' ? 'likes' : 'created_at';
      const provider = searchParams.get('provider') || null;
      const q = sanitizeSearch(searchParams.get('q') || '');
      const limit = 24;
      const offset = page * limit;

      let filter = `hidden=eq.false`;
      if (provider) filter += `&provider=eq.${encodeURIComponent(provider)}`;

      // [Task C] Server-side search using PostgREST ilike
      if (q) filter += `&prompt=ilike.*${encodeURIComponent(q)}*`;

      const path = `/icons?${filter}&select=id,prompt,svg,color,size,style,provider,model,likes,created_at&order=${sort}.desc&limit=${limit}&offset=${offset}`;
      const icons = await supabaseQuery(path);

      // [Task B] Check if current user liked any of these icons
      let likedSet = new Set();
      const auth = request.headers.get('Authorization');
      if (auth?.startsWith('Bearer ')) {
        try {
          const user = await verifyJWT(auth.slice(7));
          if (user?.id && (icons||[]).length > 0) {
            const iconIds = icons.map(i => i.id);
            const likesPath = `/icon_likes?select=icon_id&user_id=eq.${user.id}&icon_id=in.(${iconIds.join(',')})`;
            const likes = await supabaseQuery(likesPath);
            if (likes) likedSet = new Set(likes.map(l => l.icon_id));
          }
        } catch {
          // user not authenticated → no liked set, that's fine
        }
      }

      const iconsWithLike = (icons ?? []).map(i => ({
        ...i,
        userLiked: likedSet.has(i.id),
      }));

      return json({
        icons: iconsWithLike,
        page,
        hasMore: (icons?.length ?? 0) === limit,
      });
    }

    // ========== POST /api/community (publish OR like) ==========
    if (request.method === 'POST') {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');

      const auth = request.headers.get('Authorization');
      if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);
      const user = await verifyJWT(auth.slice(7));

      // ── Like action ──
      if (action === 'like') {
        const { iconId } = await request.json();
        if (!iconId) return json({ error: 'iconId required' }, 400);

        // Verify icon exists and is published
        const icons = await supabaseQuery(`/icons?id=eq.${iconId}&hidden=eq.false&select=id,likes`);
        if (!icons?.length) return json({ error: 'Icon not found' }, 404);

        // Check if already liked
        const existingLike = await supabaseQuery(`/icon_likes?icon_id=eq.${iconId}&user_id=eq.${user.id}&select=id`);
        if (existingLike?.length) {
          // Already liked — this is idempotent; return current count
          const updated = await supabaseQuery(`/icons?id=eq.${iconId}&select=likes`);
          return json({ liked: true, likes: updated?.[0]?.likes ?? icons[0].likes });
        }

        // Insert like
        await supabaseQuery('/icon_likes', 'POST', { icon_id: iconId, user_id: user.id });

        // Increment likes counter
        const newLikes = (icons[0].likes || 0) + 1;
        await supabaseQuery(`/icons?id=eq.${iconId}`, 'PATCH', { likes: newLikes });

        return json({ liked: true, likes: newLikes });
      }

      // ── Publish action (no action param = default POST behavior) ──
      const { iconId } = await request.json();
      if (!iconId) return json({ error: 'iconId required' }, 400);

      const icons = await supabaseQuery(`/icons?id=eq.${iconId}&user_id=eq.${user.id}&select=id,hidden`);
      if (!icons?.length) return json({ error: 'Icon not found or not owned by you' }, 404);
      if (icons[0].hidden === false) {
        return json({ published: true, url: `https://sednicon.sednium.com/icon/${iconId}` });
      }

      await supabaseQuery(`/icons?id=eq.${iconId}`, 'PATCH', { hidden: false });
      return json({ published: true, url: `https://sednicon.sednium.com/icon/${iconId}` });
    }

    // ========== DELETE /api/community?action=like (unlike) ==========
    if (request.method === 'DELETE') {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');
      if (action !== 'like') return json({ error: 'Unknown delete action' }, 400);

      const auth = request.headers.get('Authorization');
      if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);
      const user = await verifyJWT(auth.slice(7));

      const { iconId } = await request.json();
      if (!iconId) return json({ error: 'iconId required' }, 400);

      // Get current likes count before deleting
      const icons = await supabaseQuery(`/icons?id=eq.${iconId}&select=likes`);
      const currentLikes = icons?.[0]?.likes || 0;

      // Delete the like
      await supabaseQuery(`/icon_likes?icon_id=eq.${iconId}&user_id=eq.${user.id}`, 'DELETE');

      // Decrement likes counter
      const newLikes = Math.max(0, currentLikes - 1);
      await supabaseQuery(`/icons?id=eq.${iconId}`, 'PATCH', { likes: newLikes });

      return json({ liked: false, likes: newLikes });
    }

    return json({ error: 'Method not allowed' }, 405);

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHdrs, 'Content-Type': 'application/json' },
    });
  }
}