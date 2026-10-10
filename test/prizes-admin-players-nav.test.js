import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('prizes top nav includes score and playoffs', () => {
  const src = readFileSync(new URL('../src/prizesPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderPrizesPage/);
  assert.match(src, /href="\/rules"/);
});
