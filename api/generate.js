/**
 * Sednicon AI Generator Edge Function
 * Secure proxy for 8x AI providers with SVG sanitization and auto-repair.
 */

export const config = { runtime: 'edge' };

const SUPPORTED_PROVIDERS = new Set([
  'gemini', 'openai', 'anthropic', 'groq', 'mistral', 'together', 'nvidia', 'openrouter'
]);

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }
  
  try {
    const body = await req.json();
    const {
      prompt,
      provider = 'gemini',
      model,
      apiKey,
      size = 24,
      color = '000000',
      style = 'fill',
      strokeWidth = 2,
      corner = 'round',
    } = body;

    if (!apiKey) {
      return jsonResponse({ error: 'API Key is required.' }, 400);
    }

    if (!SUPPORTED_PROVIDERS.has(provider)) {
      return jsonResponse({ error: `Unsupported AI provider "${provider}".` }, 400);
    }

    const cleanColor = String(color || '000000').replace(/^#/, '');

    const systemPrompt = `You are an expert vector graphics designer. Generate a single, clean, highly minimal SVG icon.
Strict Rules:
1. ONLY output raw, valid SVG code. No markdown formatting, no code blocks (like \`\`\`svg), no explanations.
2. You MUST include viewBox="0 0 24 24" in the <svg> tag.
3. Use a single, continuous, simplified <path> if possible.
4. The aesthetic is modern, geometric, ${corner} corners.
${style === 'stroke' ? `Use stroke="currentColor" stroke-width="${strokeWidth}" fill="none" stroke-linecap="${corner}" stroke-linejoin="${corner}".` : `Use fill="currentColor".`}
Do not wrap the output in any HTML.`;

    let fetchUrl = '';
    let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    let payload = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
    };

    // Provider Routing
    if (provider === 'gemini') {
      fetchUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      payload = {
        contents: [{ parts: [{ text: systemPrompt + '\n\n' + prompt }] }],
        generationConfig: { temperature: 0.6 },
      };
    } else if (provider === 'anthropic') {
      fetchUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      payload = {
        model: model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      };
    } else {
      // Standard OpenAI Format (OpenAI, Groq, Mistral, Together, OpenRouter, Nvidia)
      fetchUrl = 
        provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' :
        provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' :
        provider === 'mistral' ? 'https://api.mistral.ai/v1/chat/completions' :
        provider === 'together' ? 'https://api.together.xyz/v1/chat/completions' :
        provider === 'nvidia' ? 'https://integrate.api.nvidia.com/v1/chat/completions' :
        provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : '';
    }

    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      const errMsg = typeof data.error === 'object'
        ? (data.error?.message || JSON.stringify(data.error))
        : (data.error || `Upstream API error: ${res.status}`);
      throw new Error(errMsg);
    }

    let svgRaw = '';
    if (provider === 'gemini') {
      svgRaw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'anthropic') {
      svgRaw = data.content?.[0]?.text || '';
    } else {
      svgRaw = data.choices?.[0]?.message?.content || '';
    }

    if (!svgRaw) throw new Error('AI provider returned empty response.');

    // ─── SVG AUTO-REPAIR & SANITIZATION ───
    
    // 1. Strip Markdown Wrappers
    svgRaw = svgRaw.replace(/```xml/gi, '').replace(/```svg/gi, '').replace(/```html/gi, '').replace(/```/g, '').trim();
    
    // 2. Extract strictly the SVG node
    const match = svgRaw.match(/<svg[\s\S]*<\/svg>/i);
    if (!match) throw new Error('AI failed to return valid SVG code.');
    svgRaw = match[0];

    // 3. Strip hardcoded width/height to let CSS sizing work
    svgRaw = svgRaw.replace(/\s+width="[^"]*"/g, '').replace(/\s+height="[^"]*"/g, '');

    // 4. Inject viewBox if missing
    if (!svgRaw.includes('viewBox')) {
      svgRaw = svgRaw.replace('<svg', '<svg viewBox="0 0 24 24"');
    }

    // 5. Force standard fill/stroke colors without double ##
    svgRaw = svgRaw.replace(/currentColor/gi, `#${cleanColor}`);
    
    // Default size fallback for frontend preview
    svgRaw = svgRaw.replace('<svg', `<svg width="${size}" height="${size}"`);

    return jsonResponse({
      svg: svgRaw,
      size,
      color: cleanColor,
      provider,
      model,
    });
    
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
