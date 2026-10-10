import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Gamma messages page shows next-match hook', () => {
  const src = readFileSync(new URL('../src/routerEntry.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/admin\/season-teams"/);
  assert.match(src, /href="\/admin\/players"/);
  assert.match(src, /href="\/admin"/);
});
