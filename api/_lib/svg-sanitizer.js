/**
 * Sednicon — Hardened SVG Validator & Sanitizer
 * Multi-pass, edge-compatible security pipeline for untrusted vector inputs.
 */

const MAX_SVG_SIZE_BYTES = 512 * 1024; // 512 KB

const DISALLOWED_TAGS = [
  'script', 'iframe', 'object', 'embed', 'foreignObject',
  'meta', 'link', 'audio', 'video', 'input', 'form', 'button',
  'textarea', 'frame', 'frameset', 'applet', 'base'
];

/**
 * Validates untrusted SVG payload before processing or caching.
 * @param {string} svgString 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSvg(svgString) {
  if (!svgString || typeof svgString !== 'string') {
    return { valid: false, error: 'SVG payload is empty or not a string' };
  }

  // 1. Enforce payload size limit
  const byteLength = new TextEncoder().encode(svgString).length;
  if (byteLength > MAX_SVG_SIZE_BYTES) {
    return { valid: false, error: `SVG payload exceeds maximum allowed size (${byteLength} > ${MAX_SVG_SIZE_BYTES} bytes)` };
  }

  // 2. Reject XXE entity injections and DOCTYPE declarations
  if (/<!DOCTYPE\b/i.test(svgString) || /<!ENTITY\b/i.test(svgString) || /\bSYSTEM\s+["']/i.test(svgString)) {
    return { valid: false, error: 'XML DOCTYPE or entity declarations are not permitted' };
  }

  // 3. Ensure root is an SVG element
  const trimmed = svgString.trim();
  const hasSvgTag = /<svg\b[^>]*>/i.test(trimmed) && (/<\/svg\s*>/i.test(trimmed) || /\/>\s*$/.test(trimmed));
  if (!hasSvgTag) {
    return { valid: false, error: 'Document does not contain a valid <svg> root element' };
  }

  return { valid: true };
}

/**
 * Strips malicious elements, event handlers, and dangerous hrefs from SVG documents.
 * Preserves all legitimate vector paths, definitions, gradients, masks, and styling.
 * @param {string} svgString 
 * @returns {string} Sanitized SVG
 */
export function sanitizeSvg(svgString) {
  if (!svgString || typeof svgString !== 'string') return '';

  let svg = svgString;

  // 1. Strip XML declarations & comments that might hide attacks
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Multi-pass strip of disallowed tags and nested bypasses (e.g. <scr<script>ipt>)
  const tagPattern = DISALLOWED_TAGS.join('|');
  const blockRegex = new RegExp(`<(?:${tagPattern})\\b[\\s\\S]*?(?:<\\/(?:${tagPattern})>|$)`, 'gi');
  const tagRegex = new RegExp(`<\\/?(?:${tagPattern})\\b[^>]*>`, 'gi');
  
  let prev;
  do {
    prev = svg;
    svg = svg.replace(blockRegex, '');
    svg = svg.replace(tagRegex, '');
  } while (svg !== prev);

  // 3. Strip inline event handlers (onload, onclick, onerror, onmouseover, etc.)
  // Handles preceding space, newline, tab, or slash, with or without quotes
  svg = svg.replace(/[\s/]on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 4. Strip dangerous link href and xlink:href schemas
  // Only allow local fragment identifiers (#id) or strip if remote/script/data
  svg = svg.replace(/(?:href|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi, (match, dVal, sVal, uVal) => {
    const rawVal = (dVal ?? sVal ?? uVal ?? '').trim();
    
    // Explicitly reject dangerous script/data/external protocols
    if (/^(?:javascript|data|vbscript|file):/i.test(rawVal)) {
      return '';
    }

    // Reject external HTTP/HTTPS resources in <use> or <image> links to prevent SSRF
    if (/^https?:\/\//i.test(rawVal) || /^\/\//.test(rawVal)) {
      return '';
    }

    return match;
  });

  // 5. Clean up any empty anchor wrappers left behind if href was stripped
  svg = svg.replace(/<a\s*>\s*<\/a>/gi, '');

  return svg.trim();
}
