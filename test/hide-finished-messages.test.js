import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('a finished match hides messages', () => {
  const source = readFileSync(new URL('../src/schedulePage.js', import.meta.url), 'utf8');
  assert.match(source, /if\(finalized\)messages\.remove\(\);/);
  assert.match(source, /Team score /);
});
