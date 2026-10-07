import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSvg, svgTransformer } from '../api/_lib/icon-resolver.js';

describe('SVG Sanitizer', () => {
  test('strips single-quoted href="javascript:..." attacks', () => {
    const malicious = '<svg><a href=\'javascript:alert(1)\'><path d="M0 0"/></a></svg>';
    const sanitized = sanitizeSvg(malicious);
    assert.ok(!sanitized.includes('javascript:alert(1)'));
  });

  test('strips unquoted href=javascript:... attacks', () => {
    const malicious = '<svg><a href=javascript:alert(1)><path d="M0 0"/></a></svg>';
    const sanitized = sanitizeSvg(malicious);
    assert.ok(!sanitized.includes('javascript:alert(1)'));
  });

  test('strips event handlers separated by newlines or slashes', () => {
    const malicious1 = '<svg\nonload=alert(1)><path d="M0 0"/></svg>';
    const sanitized1 = sanitizeSvg(malicious1);
    assert.ok(!sanitized1.includes('onload'));

    const malicious2 = '<svg/onload=alert(1)><path d="M0 0"/></svg>';
    const sanitized2 = sanitizeSvg(malicious2);
    assert.ok(!sanitized2.includes('onload'));
  });

  test('strips nested script tags', () => {
    const malicious = '<svg><scr<script>ipt>alert(1)</script></svg>';
    const sanitized = sanitizeSvg(malicious);
    assert.ok(!sanitized.includes('<script'));
    assert.ok(!sanitized.includes('alert(1)'));
  });

  test('preserves valid safe SVGs intact', () => {
    const safe = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>';
    const sanitized = sanitizeSvg(safe);
    assert.equal(sanitized, safe);
  });
});

describe('SVG Transformer', () => {
  test('injects width, height, and fill even when SVG has leading XML declaration or whitespace', () => {
    const svgWithXml = '<?xml version="1.0" encoding="UTF-8"?>\n<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>';
    const transformed = svgTransformer(svgWithXml, 32, '#ff6600', null);
    assert.ok(transformed.includes('width="32"'));
    assert.ok(transformed.includes('height="32"'));
    assert.ok(transformed.includes('fill="#ff6600"'));
  });

  test('injects transform-box: fill-box in keyframe animations', () => {
    const raw = '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>';
    const spun = svgTransformer(raw, 24, '#000000', 'spin');
    assert.ok(spun.includes('transform-box: fill-box'));
    assert.ok(spun.includes('transform-origin: center'));
    assert.ok(spun.includes('@keyframes spin-'));
  });

  test('replaces currentColor with requested cleanColor', () => {
    const raw = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 0"/></svg>';
    const transformed = svgTransformer(raw, 24, '#2563eb', null);
    assert.ok(transformed.includes('fill="#2563eb"'));
    assert.ok(!transformed.includes('currentColor'));
  });
});
