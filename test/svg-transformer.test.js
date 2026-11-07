import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { svgTransformer, isMulticolorSvg } from '../api/_lib/svg-transformer.js';

describe('SVG Transformer', () => {
  test('injects width, height, and fill even with leading XML declaration or whitespace', () => {
    const raw = '<?xml version="1.0"?>\n  <svg viewBox="0 0 24 24"><path d="M0 0"/></svg>';
    const transformed = svgTransformer(raw, 32, '#ff6600', null);
    assert.ok(transformed.includes('width="32"'));
    assert.ok(transformed.includes('height="32"'));
    assert.ok(transformed.includes('fill="#ff6600"'));
  });

  test('replaces currentColor with requested cleanColor in monochrome icons', () => {
    const raw = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 0"/></svg>';
    const transformed = svgTransformer(raw, 24, '#2563eb', null);
    assert.ok(transformed.includes('fill="#2563eb"'));
    assert.ok(!transformed.includes('currentColor'));
  });

  test('injects keyframe animations properly', () => {
    const raw = '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>';
    const spun = svgTransformer(raw, 24, '#000000', 'spin');
    assert.ok(spun.includes('transform-box: fill-box'));
    assert.ok(spun.includes('transform-origin: center'));
    assert.ok(spun.includes('@keyframes spin-'));
  });

  test('detects multicolor SVG correctly', () => {
    const mono = '<svg viewBox="0 0 24 24"><path fill="#000000" d="M0 0"/></svg>';
    assert.equal(isMulticolorSvg(mono), false);

    const multi = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M0 0"/><path fill="#EA4335" d="M1 1"/></svg>';
    assert.equal(isMulticolorSvg(multi), true);
  });

  test('preserves multicolor SVG paths when preserveOriginal is true or no recolor is forced', () => {
    const multi = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M0 0"/><path fill="#EA4335" d="M1 1"/></svg>';
    const transformed = svgTransformer(multi, 48, '#000000', null, { preserveOriginal: true });
    assert.ok(transformed.includes('fill="#4285F4"'), 'Should keep Google blue');
    assert.ok(transformed.includes('fill="#EA4335"'), 'Should keep Google red');
    assert.ok(transformed.includes('width="48"'));
    assert.ok(transformed.includes('height="48"'));
  });

  test('customizes stroke-width when requested', () => {
    const strokeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M0 0"/></svg>';
    const transformed = svgTransformer(strokeSvg, 24, '#000000', null, { strokeWidth: 3.5 });
    assert.ok(transformed.includes('stroke-width="3.5"'));
  });
});
