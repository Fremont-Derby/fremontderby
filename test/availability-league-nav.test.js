import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('availability shortcuts cover league night', () => {
  const src = readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  const i = src.indexOf('data-shortcuts');
  const chunk = src.slice(i, i + 2500);
  for (const href of ['/scorecard', '/standings', '/trades', '/playoffs', '/notifications', '/lineup']) {
    assert.match(chunk, new RegExp(href.replace('/', '\\/')));
  }
});
