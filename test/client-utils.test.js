import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getIconVariations } from '../src/utils/api.js';

describe('Client icon URL helpers', () => {
  test('keeps the Iconify collection prefix when opening a search result', () => {
    const variations = getIconVariations('mdi:account-clock', '#2563eb', 32);
    assert.equal(variations[0].id, 'search-mdi');
    assert.match(variations[0].url, /api\.iconify\.design\/mdi\/account-clock\.svg/);
    assert.match(variations[0].renderUrl, /q=mdi%3Aaccount-clock/);
  });

  test('provides the usual multi-set styles for unprefixed curated icons', () => {
    const variations = getIconVariations('rocket', '#2563eb', 24);
    assert.equal(variations[0].id, 'material-outlined');
    assert.ok(variations.some((variation) => variation.id === 'lucide'));
    assert.ok(variations.some((variation) => variation.id === 'tabler'));
  });
});
