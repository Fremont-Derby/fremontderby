import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('players directory score nav and empty recovery', () => {
  const src = readFileSync(new URL('../src/playersDirectoryPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /No players match/);
  assert.match(src, /Keep typing/);
});
