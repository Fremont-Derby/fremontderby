import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('trades page links score hub', () => {
  const src = readFileSync(new URL('../src/tradesPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
});

test('trade path aliases resolve to me/trades', () => {
  assert.equal(normalizeApiPathname('/api/my-trades'), '/api/me/trades');
  assert.equal(normalizeApiPathname('/api/trades'), '/api/me/trades');
});
