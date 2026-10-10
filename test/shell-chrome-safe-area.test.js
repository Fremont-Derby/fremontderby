import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('sticky shell respects notch safe-area', () => {
  const src = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  assert.match(src, /friendlyErrorMessage/);
  assert.match(src, /href="\/messages"/);
  assert.match(src, /href="\/messages"/);
  assert.match(src, /href="\/favicon.svg"/);
});
