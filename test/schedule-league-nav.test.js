import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('schedule related nav covers league night', () => {
  const src = readFileSync(new URL('../src/schedulePage.js', import.meta.url), 'utf8');
  const i = src.indexOf('aria-label="Related"');
  const chunk = src.slice(i, i + 1500);
  for (const href of ['/scorecard', '/standings', '/trades', '/playoffs', '/messages', '/lineup']) {
    assert.match(chunk, new RegExp(href.replace('/', '\\/')));
  }
});
