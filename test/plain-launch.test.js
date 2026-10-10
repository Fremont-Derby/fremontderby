import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('page note is present', () => {
  const src = readFileSync(new URL('../src/demoSeasonPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderDemoSeasonPage/);
  assert.match(src, /href="\/favicon.svg"/);
  assert.match(src, /href="\/sandbox\/captain"/);
  assert.match(src, /href="\/sandbox\/player"/);
});
