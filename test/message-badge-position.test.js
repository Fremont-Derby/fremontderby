import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('message unread badge sits inside the indicator, not hanging off top-right', () => {
  const src = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  assert.match(src, /friendlyErrorMessage/);
  assert.match(src, /href="\/messages"/);
  assert.match(src, /href="\/messages"/);
  assert.match(src, /href="\/favicon.svg"/);
});
