/**
 * Sednicon API - AI Icon Generation
 * POST /api/generate
 * Supports: Gemini, OpenAI, Anthropic, Groq, Mistral, Together AI, Nvidia, OpenRouter
 */

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
function buildSystemPrompt({ style, strokeWidth, corner }) {
  const isStroke = style === 'stroke';
  const cornerHint = corner === 'round'
    ? 'Use stroke-linecap="round" stroke-linejoin="round" on all paths.'
    : 'Use stroke-linecap="square" stroke-linejoin="miter" on all paths.';

  return `You are a professional SVG icon designer. Your ONLY job is to output a single valid SVG icon.

STRICT RULES — violating any rule makes the output invalid:
1. Output ONLY the raw <svg> element. No markdown, no code fences, no explanation, no comments before or after.
2. viewBox MUST be exactly "0 0 24 24". No exceptions.
3. ${isStroke
    ? `Use ONLY stroke-based drawing: stroke="currentColor" fill="none" stroke-width="${strokeWidth}" on all shape elements. ${cornerHint}`
    : `Use ONLY fill-based drawing: fill="currentColor" on all shape elements. No stroke.`}
4. NEVER use hardcoded colors (no hex, no rgb(), no named colors like "black" or "red"). Only currentColor.
5. Allowed elements: <svg>, <path>, <circle>, <rect>, <line>, <polygon>, <polyline>, <ellipse>, <g>.
6. FORBIDDEN elements: <text>, <image>, <foreignObject>, <script>, <style>, <defs> with filters, <animate>, <use>.
7. FORBIDDEN attributes: any on* event handlers, any xlink:href to external URLs, any <script>.
8. Maximum 12 shape elements total. Keep it clean and minimal.
9. The icon must be recognizable at 24×24 pixels — avoid fine detail, prefer bold clear shapes.
10. Style target: matches the Lucide / Material Symbols aesthetic — geometric, clean, minimal.

Output the SVG element and absolutely nothing else.`;
}

// ─── PROVIDER CONFIGS ────────────────────────────────────────────────────────
const PROVIDERS = {
  gemini: {
    name: 'Gemini',
    models: ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.1-flash-lite'],
    defaultModel: 'gemini-2.5-flash',
    call: callGemini,
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o-mini',
    call: callOpenAI,
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
    defaultModel: 'claude-sonnet-4-6',
    call: callAnthropic,
  },
  groq: {
    name: 'Groq',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
    call: callOpenAICompat,
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  mistral: {
    name: 'Mistral',
    models: ['mistral-large-latest', 'mistral-small-latest', 'open-mixtral-8x22b'],
    defaultModel: 'mistral-large-latest',
    call: callOpenAICompat,
    baseUrl: 'https://api.mistral.ai/v1',
  },
  together: {
    name: 'Together AI',
    models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x22B-Instruct-v0.1'],
    defaultModel: 'meta-llama/Llama-3-70b-chat-hf',
    call: callOpenAICompat,
    baseUrl: 'https://api.together.xyz/v1',
  },
  nvidia: {
    name: 'Nvidia',
    models: ['meta/llama-3.1-70b-instruct', 'mistralai/mistral-large-2-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct'],
    defaultModel: 'meta/llama-3.1-70b-instruct',
    call: callOpenAICompat,
    baseUrl: 'https://integrate.api.nvidia.com/v1',
  },
  openrouter: {
    name: 'OpenRouter',
    models: ['anthropic/claude-sonnet-4-6', 'google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct:free'],
    defaultModel: 'google/gemini-2.5-flash',
    call: callOpenAICompat,
    baseUrl: 'https://openrouter.ai/api/v1',
  },
};

// ─── PROVIDER CALL FUNCTIONS ─────────────────────────────────────────────────
async function callGemini(apiKey, model, systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Gemini error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenAI(apiKey, model, systemPrompt, userPrompt) {
  return callOpenAICompat(apiKey, model, systemPrompt, userPrompt, 'https://api.openai.com/v1');
}

async function callAnthropic(apiKey, model, systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callOpenAICompat(apiKey, model, systemPrompt, userPrompt, baseUrl) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Provider error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── SVG SANITIZER ───────────────────────────────────────────────────────────
const ALLOWED_TAGS = new Set(['svg','path','circle','rect','line','polygon','polyline','ellipse','g']);
const FORBIDDEN_ATTRS = /^on|xlink:href|href|src/i;
const FORBIDDEN_TAGS_RE = /<(script|style|foreignobject|image|text|animate|use)[^>]*>/gi;

function sanitizeSVG(raw) {
  // Extract just the SVG element
  const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!svgMatch) throw new Error('No SVG element found in model output');

  let svg = svgMatch[0];

  // Strip forbidden tags entirely
  svg = svg.replace(FORBIDDEN_TAGS_RE, '');

  // Remove event handlers and dangerous attributes
  svg = svg.replace(/\s+on\w+="[^"]*"/gi, '');
  svg = svg.replace(/\s+xlink:href="[^"]*"/gi, '');
  svg = svg.replace(/\s+href="[^"]*"/gi, '');

  // Strip <script> and </script> blocks
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Ensure viewBox is correct
  if (!svg.includes('viewBox="0 0 24 24"')) {
    // Try to normalize common variations
    svg = svg.replace(/viewBox="[^"]*"/i, 'viewBox="0 0 24 24"');
    if (!svg.includes('viewBox')) {
      svg = svg.replace('<svg', '<svg viewBox="0 0 24 24"');
    }
  }

  // Ensure xmlns is present
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Force currentColor for any remaining hardcoded colors
  svg = svg.replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"');
  svg = svg.replace(/fill="(?!currentColor|none)[a-zA-Z]+"/g, 'fill="currentColor"');
  svg = svg.replace(/stroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"');
  svg = svg.replace(/stroke="(?!currentColor|none)[a-zA-Z]+"/g, 'stroke="currentColor"');

  // Sanity checks
  if (svg.length < 50) throw new Error('SVG output too short to be valid');
  if (svg.length > 20000) throw new Error('SVG output too large — likely malformed');
  if (!svg.includes('currentColor') && !svg.includes('fill') && !svg.includes('stroke')) {
    throw new Error('SVG has no color attributes — likely invalid');
  }

  return svg.trim();
}

// ─── ENCRYPTION (AES-256-GCM) ────────────────────────────────────────────────
async function getEncryptionKey() {
  const raw = atob(ENCRYPTION_SECRET);
  const keyBytes = new Uint8Array(raw.length).map((_, i) => raw.charCodeAt(i));
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptKey(plaintext) {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decryptKey(encryptedB64, ivB64) {
  const key = await getEncryptionKey();
  const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

// ─── SUPABASE HELPERS ────────────────────────────────────────────────────────
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }
  return res.json();
}

async function verifyJWT(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Invalid or expired session');
  return res.json();
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── Auth ──
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userToken = authHeader.slice(7);
    const user = await verifyJWT(userToken);

    // ── Parse body ──
    const body = await request.json();
    const {
      prompt,
      provider = 'gemini',
      model: requestedModel,
      apiKey: providedKey,
      saveKey = false,
      size = 24,
      color = '000000',
      style = 'fill',
      strokeWidth = 2,
      corner = 'round',
    } = body;

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const providerConfig = PROVIDERS[provider];
    if (!providerConfig) {
      return new Response(JSON.stringify({ error: `Unknown provider: ${provider}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Resolve API key ──
    let apiKey = providedKey?.trim();

    if (!apiKey) {
      // Try to load saved key from Supabase
      const keys = await supabaseQuery(
        `/user_keys?user_id=eq.${user.id}&provider=eq.${provider}&select=encrypted_key,iv`
      );
      if (!keys?.length) {
        return new Response(JSON.stringify({ error: `No API key found for ${provider}. Please provide one.` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      apiKey = await decryptKey(keys[0].encrypted_key, keys[0].iv);
    }

    // ── Optionally save key ──
    if (saveKey && providedKey?.trim()) {
      const { encrypted, iv } = await encryptKey(providedKey.trim());
      // Use Supabase upsert (merge on conflict) via Prefer header
      await fetch(`${SUPABASE_URL}/rest/v1/user_keys`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: user.id,
          provider,
          encrypted_key: encrypted,
          iv,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    // ── Build prompts ──
    const systemPrompt = buildSystemPrompt({ style, strokeWidth, corner });
    const userPrompt = `Create an SVG icon for: "${prompt.trim()}"\nStyle: ${style === 'stroke' ? `stroke-based, stroke-width ${strokeWidth}` : 'fill-based'}, ${corner} corners.\nThe icon should be simple, recognizable, and match the Lucide/Material icon aesthetic.`;

    // ── Call AI provider ──
    const usedModel = requestedModel || providerConfig.defaultModel;
    let rawOutput;

    if (provider === 'openai') {
      rawOutput = await callOpenAI(apiKey, usedModel, systemPrompt, userPrompt);
    } else if (provider === 'anthropic') {
      rawOutput = await callAnthropic(apiKey, usedModel, systemPrompt, userPrompt);
    } else if (provider === 'gemini') {
      rawOutput = await callGemini(apiKey, usedModel, systemPrompt, userPrompt);
    } else {
      // OpenAI-compatible providers (Groq, Mistral, Together, Nvidia, OpenRouter)
      rawOutput = await callOpenAICompat(apiKey, usedModel, systemPrompt, userPrompt, providerConfig.baseUrl);
    }

    // ── Sanitize ──
    const svg = sanitizeSVG(rawOutput);

    // ── Store in Supabase ──
    const clampedSize = Math.min(2048, Math.max(1, parseInt(size) || 24));
    const cleanColor = /^[0-9a-fA-F]{3,8}$/.test(color) ? color : '000000';

    const [inserted] = await supabaseQuery('/icons', 'POST', {
      user_id: user.id,
      prompt: prompt.trim().slice(0, 500),
      svg,
      color: cleanColor,
      size: clampedSize,
      style,
      stroke_width: parseFloat(strokeWidth) || 2,
      provider,
      model: usedModel,
    });

    return new Response(JSON.stringify({
      id: inserted.id,
      svg,
      url: `https://sednicon.sednium.com/api/render?q=ai:${inserted.id}`,
      size: clampedSize,
      color: cleanColor,
      provider,
      model: usedModel,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Generate error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
