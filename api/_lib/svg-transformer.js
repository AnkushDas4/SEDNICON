/**
 * Sednicon — SVG Transformer Engine
 * Dynamic sizing, colorization, stroke control, animation injection, and multicolor preservation.
 */

/**
 * Checks whether an SVG contains multiple distinct colors (e.g. logos, brand assets, multi-stop gradients).
 * @param {string} svg 
 * @returns {boolean}
 */
export function isMulticolorSvg(svg) {
  if (!svg || typeof svg !== 'string') return false;

  const colorMatches = svg.match(/(?:fill|stroke|stop-color)=["']([^"']+)["']/gi) || [];
  const palette = new Set();

  for (const match of colorMatches) {
    const val = match.replace(/^(?:fill|stroke|stop-color)=["']|["']$/gi, '').trim().toLowerCase();
    // Exclude structural/neutral values
    if (val === 'none' || val === 'currentcolor' || val === 'transparent' || val.startsWith('url(')) {
      continue;
    }
    palette.add(val);
  }

  // If 2 or more distinct colors are used, it's multi-color
  return palette.size >= 2;
}

/**
 * Transforms an SVG with responsive dimensions, clean color application, stroke width, and animation.
 * @param {string} svgRaw 
 * @param {number} size 
 * @param {string} cleanColor 
 * @param {string|null} anim 
 * @param {object} options 
 * @returns {string} Transformed SVG
 */
export function svgTransformer(svgRaw, size = 24, cleanColor = '#000000', anim = null, options = {}) {
  if (!svgRaw || typeof svgRaw !== 'string') return '';

  const {
    strokeWidth,
    preserveOriginal = false,
  } = options;

  let svg = svgRaw;

  // 1. Strip existing width and height on root <svg>
  svg = svg.replace(/(<svg\b[^>]*)(\s+width=["'][^"']*["'])/i, '$1');
  svg = svg.replace(/(<svg\b[^>]*)(\s+height=["'][^"']*["'])/i, '$1');

  // 2. Inject requested width and height
  svg = svg.replace(/<svg\b/i, `<svg width="${size}" height="${size}"`);

  // 3. Ensure xmlns is present on root <svg>
  if (!/xmlns=/i.test(svg)) {
    svg = svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // 4. Colorization & Multi-color handling
  const isMulti = isMulticolorSvg(svg);
  const shouldPreserve = preserveOriginal || (isMulti && (cleanColor === '#000000' || cleanColor === 'black' || !cleanColor));

  if (shouldPreserve) {
    // Preserve existing color palette, only replace currentColor if present
    if (cleanColor) {
      svg = svg.replace(/currentColor/gi, cleanColor);
    }
  } else {
    // Standard monochrome recoloring
    svg = svg.replace(/currentColor/gi, cleanColor);
    svg = svg.replace(/fill="(?!none\b)[^"]+"/gi, `fill="${cleanColor}"`);
    svg = svg.replace(/stroke="(?!none\b)[^"]+"/gi, `stroke="${cleanColor}"`);
    if (!/fill=/i.test(svg)) {
      svg = svg.replace(/<svg\b/i, `<svg fill="${cleanColor}"`);
    }
  }

  // 5. Stroke width override
  if (strokeWidth !== undefined && strokeWidth !== null) {
    if (/stroke-width=["'][^"']*["']/i.test(svg)) {
      svg = svg.replace(/stroke-width=["'][^"']*["']/gi, `stroke-width="${strokeWidth}"`);
    } else {
      svg = svg.replace(/<svg\b/i, `<svg stroke-width="${strokeWidth}"`);
    }
  }

  // 6. Magic animations (spin, pulse, bounce)
  if (anim) {
    let animStyle = '';
    const uid = Math.random().toString(36).substring(2, 8); // Unique ID to isolate styles

    if (anim === 'spin') {
      animStyle = `@keyframes spin-${uid} { 100% { transform: rotate(360deg); } } svg { overflow: visible !important; } .sednicon-anim { transform-box: fill-box; transform-origin: center; animation: spin-${uid} 2s linear infinite; }`;
    } else if (anim === 'pulse') {
      animStyle = `@keyframes pulse-${uid} { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.85); opacity: 0.7; } } svg { overflow: visible !important; } .sednicon-anim { transform-box: fill-box; transform-origin: center; animation: pulse-${uid} 1.5s ease-in-out infinite; }`;
    } else if (anim === 'bounce') {
      animStyle = `@keyframes bounce-${uid} { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20%); } } svg { overflow: visible !important; } .sednicon-anim { transform-box: fill-box; transform-origin: center; animation: bounce-${uid} 1s cubic-bezier(0.28,0.84,0.42,1) infinite; }`;
    }

    if (animStyle) {
      svg = svg.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/i, (match, open, content, close) => {
        return `${open}<style>${animStyle}</style><g class="sednicon-anim">${content}</g>${close}`;
      });
    }
  }

  return svg;
}
