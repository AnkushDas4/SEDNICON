/**
 * Sednicon — Shared Auth Utility
 * Handles Supabase Google OAuth sign-in/out and nav state
 */

const SUPABASE_URL = 'https://ojsbvbohxojffkugwmub.supabase.co';
// Anon key is intentionally public (Supabase Row Level Security enforces access control)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qc2J2Ym9oeG9qZmZrdWd3bXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDkxMjcsImV4cCI6MjA5NzA4NTEyN30.cwWSmtR55nM8dzkoWF3ORtwNQiqq2u14kG94V5KG318';

// Lazy-load Supabase client from CDN
let _supabase = null;

async function getSupabase() {
  if (_supabase) return _supabase;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}

// Sign in with Google (redirects to Google, returns to /generate)
export async function signInWithGoogle() {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/generate`,
    },
  });
  if (error) console.error('Sign in error:', error.message);
}

// Sign out
export async function signOut() {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  window.location.href = '/';
}

// Get current session/user
export async function getUser() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Get current session (includes access token for API calls)
export async function getSession() {
  const supabase = await getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Update nav based on auth state — call on every page load
export async function initNav() {
  const supabase = await getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  updateNavUI(session?.user ?? null);

  // Listen for auth state changes (sign in / sign out)
  supabase.auth.onAuthStateChange((_event, session) => {
    updateNavUI(session?.user ?? null);
  });
}

function updateNavUI(user) {
  const authBtn = document.getElementById('nav-auth-btn');
  if (!authBtn) return;

  if (user) {
    const avatar = user.user_metadata?.avatar_url
      ? `<img src="${user.user_metadata.avatar_url}" class="nav-avatar" alt="${user.user_metadata.full_name ?? 'Profile'}">`
      : `<span class="material-icons" style="font-size:20px; color:var(--text-muted);">account_circle</span>`;

    authBtn.innerHTML = `
      <a href="/profile" style="display:flex; align-items:center; gap:8px; text-decoration:none;">
        ${avatar}
      </a>
    `;
  } else {
    authBtn.innerHTML = `
      <button class="btn-nav-signin" id="signin-btn">
        <span class="material-icons" style="font-size:16px;">login</span> Sign in
      </button>
    `;
    document.getElementById('signin-btn')?.addEventListener('click', signInWithGoogle);
  }
}

// Export supabase client for use in other modules
export { getSupabase };
