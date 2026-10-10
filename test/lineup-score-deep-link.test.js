import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lineup scoreHref is dynamic with match query', () => {
  const src = readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderLineupPage/);
  assert.match(src, /href="\/profile"/);
});
