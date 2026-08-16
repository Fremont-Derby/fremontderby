import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('home has exactly one Score CTA', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  assert.equal((src.match(/href="\/scorecard"/g) || []).length, 1);
  assert.match(src, /href="\/availability"/);
  assert.match(src, /href="\/schedule"/);
});
