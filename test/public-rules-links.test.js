import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('rules page links back to live league surfaces', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  assert.match(src, /renderIntroPage/);
  assert.match(src, /href="\/favicon.svg"/);
  assert.match(src, /href="\/profile"/);
  assert.match(src, /href="\/demo"/);
});
