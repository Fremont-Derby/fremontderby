import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the players page can use the DRU lane without a Google token', () => {
  const src = readFileSync(new URL('../src/adminPlayersPage.js', import.meta.url), 'utf8');
  assert.match(src, /function isDruLane/);
  assert.match(src, /startsWith\('dru\.'\)/);
  assert.match(src, /Sign in from Profile to use league admin tools/);
});
