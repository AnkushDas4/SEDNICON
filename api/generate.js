/**
 * Sednicon API - Headless AI Icon Generation
 * POST /api/generate
 */

export const config = { runtime: 'edge' };

// Max prompt length
const MAX_PROMPT_LENGTH = 500;
const MAX_SVG_LENGTH = 20000;

const ALLOWED_ORIGINS = [
  'https://sednicon.sednium.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getCorsOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.some(a => origin.startsWith(a))) return origin;
  return ALLOWED_ORIGINS[0];
}

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
  gemini: { defaultModel: 'gemini-2.5-flash', call: callGemini },
  openai: { defaultModel: 'gpt-4o-mini', call: callOpenAI },
  anthropic: { defaultModel: 'claude-sonnet-4-6', call: callAnthropic },
  groq: { defaultModel: 'llama-3.3-70b-versatile', call: callOpenAICompat, baseUrl: 'https://api.groq.com/openai/v1' },
  mistral: { defaultModel: 'mistral-large-latest', call: callOpenAICompat, baseUrl: 'https://api.mistral.ai/v1' },
  together: { defaultModel: 'meta-llama/Llama-3-70b-chat-hf', call: callOpenAICompat, baseUrl: 'https://api.together.xyz/v1' },
  nvidia: { defaultModel: 'meta/llama-3.1-70b-instruct', call: callOpenAICompat, baseUrl: 'https://integrate.api.nvidia.com/v1' },
  openrouter: { defaultModel: 'google/gemini-2.5-flash', call: callOpenAICompat, baseUrl: 'https://openrouter.ai/api/v1' },
};

// ─── AI PROVIDER CALLS ───────────────────────────────────────────────────────
async function callGemini(apiKey, model, systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenAI(apiKey, model, systemPrompt, userPrompt) {
  return callOpenAICompat(apiKey, model, systemPrompt, userPrompt, 'https://api.openai.com/v1');
}

async function callAnthropic(apiKey, model, systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 2048, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }], temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callOpenAICompat(apiKey, model, systemPrompt, userPrompt, baseUrl) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.3, max_tokens: 2048 }),
  });
  if (!res.ok) throw new Error(`Provider error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── SANITIZER ───────────────────────────────────────────────────────────────
function sanitizeSVG(raw) {
  const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!svgMatch) throw new Error('No SVG element found in model output');
  let svg = svgMatch[0];

  svg = svg.replace(/<!--[\s\S]*?-->/g, '');
  svg = svg.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  svg = svg.replace(/<style[\s\S]*?<\/style\s*>/gi, '');
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '');
  svg = svg.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  svg = svg.replace(/(href|xlink:href|src)\s*=\s*["']([^"']*)["']/gi, (match, attr, val) => {
    if (/^(javascript|data|vbscript|file):/i.test(val.trim())) return '';
    if (/^[\s#]/.test(val)) return match;
    return '';
  });
  svg = svg.replace(/style\s*=\s*["']([^"']*)["']/gi, (match, styleVal) => {
    if (/expression\s*\(|url\s*\(\s*["']?\s*(javascript|data|vbscript):/i.test(styleVal)) return '';
    return match;
  });

  if (!svg.includes('viewBox="0 0 24 24"')) {
    svg = svg.replace(/viewBox="[^"]*"/i, 'viewBox="0 0 24 24"');
    if (!svg.includes('viewBox')) svg = svg.replace('<svg', '<svg viewBox="0 0 24 24"');
  }
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

  svg = svg.replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"');
  svg = svg.replace(/fill="(?!currentColor|none)[a-zA-Z]+"/g, 'fill="currentColor"');
  svg = svg.replace(/stroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"');
  svg = svg.replace(/stroke="(?!currentColor|none)[a-zA-Z]+"/g, 'stroke="currentColor"');

  if (svg.length < 50 || svg.length > MAX_SVG_LENGTH) throw new Error('Invalid SVG size');
  return svg.trim();
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await request.json();
    const { prompt, provider = 'gemini', model: requestedModel, apiKey, size = 24, color = '000000', style = 'fill', strokeWidth = 2, corner = 'round' } = body;

    if (!apiKey?.trim()) return new Response(JSON.stringify({ error: 'API key is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!prompt?.trim() || prompt.trim().length > MAX_PROMPT_LENGTH) return new Response(JSON.stringify({ error: 'Invalid prompt' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const providerConfig = PROVIDERS[provider];
    if (!providerConfig) return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const systemPrompt = buildSystemPrompt({ style, strokeWidth, corner });
    const userPrompt = `Create an SVG icon for: "${prompt.trim()}"\nStyle: ${style === 'stroke' ? `stroke-based, stroke-width ${strokeWidth}` : 'fill-based'}, ${corner} corners.\nThe icon should be simple, recognizable, and match the Lucide/Material icon aesthetic.`;

    const usedModel = requestedModel || providerConfig.defaultModel;
    let rawOutput;

    if (provider === 'openai') rawOutput = await callOpenAI(apiKey, usedModel, systemPrompt, userPrompt);
    else if (provider === 'anthropic') rawOutput = await callAnthropic(apiKey, usedModel, systemPrompt, userPrompt);
    else if (provider === 'gemini') rawOutput = await callGemini(apiKey, usedModel, systemPrompt, userPrompt);
    else rawOutput = await callOpenAICompat(apiKey, usedModel, systemPrompt, userPrompt, providerConfig.baseUrl);

    const svg = sanitizeSVG(rawOutput);
    const clampedSize = Math.min(2048, Math.max(1, parseInt(size) || 24));
    const cleanColor = /^[0-9a-fA-F]{3,8}$/.test(color) ? color : '000000';

    return new Response(JSON.stringify({
      svg,
      size: clampedSize,
      color: cleanColor,
      provider,
      model: usedModel,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
