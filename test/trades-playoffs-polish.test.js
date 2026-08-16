import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('trades empty state has recovery links', () => {
  const src = readFileSync(new URL('../src/tradesPage.js', import.meta.url), 'utf8');
  assert.match(src, /No trades yet/);
  assert.match(src, /Propose a roster move/);
  assert.match(src, /href="\/teams"/);
});

test('playoffs match cards include lineup', () => {
  const src = readFileSync(new URL('../src/playoffsPage.js', import.meta.url), 'utf8');
  assert.match(src, /lineup\.textContent='Lineup'/);
});

test('players directory message is touch-friendly', () => {
  const src = readFileSync(new URL('../src/playersDirectoryPage.js', import.meta.url), 'utf8');
  assert.match(src, /min-height:44px/);
});
