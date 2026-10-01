import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('messages page links score hub', () => {
  const src = readFileSync(new URL('../src/chatPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /Score hub/);
  assert.match(src, /href="\/lineup"/);
});
