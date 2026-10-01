import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lineup page has league night nav', () => {
  const src = readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(src, /aria-label="League night"/);
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/trades"/);
  assert.match(src, /href="\/availability"/);
});
