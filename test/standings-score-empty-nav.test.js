import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('standings related nav expanded', () => {
  const src = readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  const i = src.indexOf('data-standings-shortcuts');
  const chunk = src.slice(i, i + 2000);
  for (const href of ['/scorecard', '/lineup', '/trades', '/playoffs', '/messages']) {
    assert.match(chunk, new RegExp(href.replace('/', '\\/')));
  }
});

test('score empty offers lineup recovery', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /Build lineup/);
  assert.match(src, /\/lineup/);
});
