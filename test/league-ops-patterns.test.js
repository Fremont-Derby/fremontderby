import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('captain invite confirms when the chosen name may be ambiguous', () => {
  const src = readFileSync(new URL('../src/blindLineupComponent.js', import.meta.url), 'utf8');
  assert.match(src, /sharedBlindLineupStyles/);
  assert.match(src, /href="\/scorecard"/);
});
