import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('players directory league night nav', () => {
  const src = readFileSync(new URL('../src/playersDirectoryPage.js', import.meta.url), 'utf8');
  for (const href of ['/scorecard', '/lineup', '/availability', '/trades', '/playoffs']) {
    assert.match(src, new RegExp(href.replace('/', '\\/')));
  }
});
