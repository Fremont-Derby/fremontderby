import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('demo next CTAs cover league night', () => {
  const src = readFileSync(new URL('../src/demoSeasonPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/availability"/);
  assert.match(src, /href="\/lineup"/);
});
