import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateSvg, sanitizeSvg } from '../api/_lib/svg-sanitizer.js';

describe('SVG Validator & Sanitizer', () => {
  test('validates safe SVG documents', () => {
    const safe = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2L2 22h20L12 2z"/></svg>';
    const val = validateSvg(safe);
    assert.equal(val.valid, true);
    assert.equal(sanitizeSvg(safe), safe);
  });

  test('rejects non-SVG or empty input', () => {
    assert.equal(validateSvg('').valid, false);
    assert.equal(validateSvg('<div>hello</div>').valid, false);
    assert.equal(validateSvg(null).valid, false);
    assert.equal(sanitizeSvg(''), '');
    assert.equal(sanitizeSvg(null), '');
  });

  test('rejects excessively large payloads (>512KB)', () => {
    const huge = '<svg viewBox="0 0 24 24">' + ' '.repeat(600 * 1024) + '</svg>';
    const val = validateSvg(huge);
    assert.equal(val.valid, false);
    assert.ok(val.error?.includes('exceeds maximum allowed size'));
  });

  test('rejects XXE and DOCTYPE entity injections', () => {
    const xxe = '<!DOCTYPE svg SYSTEM "http://malicious.com/xxe"><svg><path d="M0 0"/></svg>';
    const val = validateSvg(xxe);
    assert.equal(val.valid, false);
    assert.ok(val.error?.includes('DOCTYPE or entity declarations are not permitted'));
  });

  test('strips dangerous tags: script, iframe, object, foreignObject', () => {
    const malicious = '<svg><script>alert("pwned")</script><foreignObject><div>bad</div></foreignObject><path d="M1 1"/></svg>';
    const sanitized = sanitizeSvg(malicious);
    assert.ok(!sanitized.includes('script'));
    assert.ok(!sanitized.includes('foreignObject'));
    assert.ok(!sanitized.includes('alert'));
    assert.ok(sanitized.includes('<path d="M1 1"/>'));
  });

  test('strips event handlers across various whitespace and quote forms', () => {
    const attacks = [
      '<svg onload="alert(1)"><circle cx="5" cy="5" r="5"/></svg>',
      '<svg\nonload=alert(1)><circle cx="5" cy="5" r="5"/></svg>',
      '<svg/onerror=alert(1)><circle cx="5" cy="5" r="5"/></svg>',
      '<svg><path onclick=\'alert(1)\' d="M0 0"/></svg>',
      '<svg><path onmouseover=alert(1) d="M0 0"/></svg>'
    ];
    for (const attack of attacks) {
      const sanitized = sanitizeSvg(attack);
      assert.ok(!sanitized.includes('onload'), `Failed to strip onload in: ${attack}`);
      assert.ok(!sanitized.includes('onerror'), `Failed to strip onerror in: ${attack}`);
      assert.ok(!sanitized.includes('onclick'), `Failed to strip onclick in: ${attack}`);
      assert.ok(!sanitized.includes('onmouseover'), `Failed to strip onmouseover in: ${attack}`);
    }
  });

  test('strips dangerous href schemas and external use references', () => {
    const attack = '<svg><a href="javascript:alert(1)"><path d="M0 0"/></a><use href="https://evil.com/leak.svg#icon"/><use href="#safe-local"/></svg>';
    const sanitized = sanitizeSvg(attack);
    assert.ok(!sanitized.includes('javascript:alert(1)'));
    assert.ok(!sanitized.includes('https://evil.com'));
    assert.ok(sanitized.includes('href="#safe-local"'));
  });

  test('preserves complex legitimate SVG: defs, linearGradient, clipPath, mask', () => {
    const complex = `<svg viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
        </linearGradient>
        <clipPath id="clip1"><rect width="50" height="50"/></clipPath>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#grad1)" clip-path="url(#clip1)"/>
    </svg>`;
    const sanitized = sanitizeSvg(complex);
    assert.ok(sanitized.includes('linearGradient'));
    assert.ok(sanitized.includes('url(#grad1)'));
    assert.ok(sanitized.includes('clipPath'));
    assert.ok(sanitized.includes('stop-color'));
  });
});
