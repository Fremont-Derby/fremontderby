import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('playoffs nav covers league night', () => {
  const src = readFileSync(new URL('../src/playoffsPage.js', import.meta.url), 'utf8');
  for (const href of ['/scorecard', '/lineup', '/availability', '/trades', '/messages', '/prizes']) {
    assert.match(src, new RegExp(href.replace('/', '\\/')));
  }
});
