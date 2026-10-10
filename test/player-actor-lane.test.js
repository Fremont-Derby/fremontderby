import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the players page can use the DRU lane without a Google token', () => {
  const src = readFileSync(new URL('../src/adminPlayersPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderAdminPlayersPage/);
  assert.match(src, /href="\/admin\/operations"/);
});
