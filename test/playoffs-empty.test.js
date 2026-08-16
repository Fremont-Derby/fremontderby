import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('playoffs empty states have recovery links', () => {
  const src = readFileSync(new URL('../src/playoffsPage.js', import.meta.url), 'utf8');
  assert.match(src, /No postseason rounds yet/);
  assert.match(src, /href="\/standings"/);
  assert.match(src, /href="\/scorecard"/);
});

test('availability recovery includes score hub', () => {
  const src = readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  assert.match(src, /Score hub/);
});
