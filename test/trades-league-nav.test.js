import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('trades page league night nav', () => {
  const src = readFileSync(new URL('../src/tradesPage.js', import.meta.url), 'utf8');
  for (const href of ['/scorecard', '/lineup', '/availability', '/schedule', '/playoffs']) {
    assert.match(src, new RegExp(href.replace('/', '\\/')));
  }
});
