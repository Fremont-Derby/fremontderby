import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('prizes top nav includes score and playoffs', () => {
  const src = readFileSync(new URL('../src/prizesPage.js', import.meta.url), 'utf8');
  assert.match(src, /class="ghost" href="\/scorecard"/);
  assert.match(src, /class="ghost" href="\/playoffs"/);
});

test('admin players links audit and score', () => {
  const src = readFileSync(new URL('../src/adminPlayersPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/admin\/audit"/);
  assert.match(src, /href="\/scorecard"/);
});
