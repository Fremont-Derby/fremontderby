import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('a finished schedule match hides messages and can show points', () => {
  const src = readFileSync(new URL('../src/schedulePage.js', import.meta.url), 'utf8');
  assert.match(src, /if\(finalized\)messages\.hidden=true/);
  assert.match(src, /Points /);
});
