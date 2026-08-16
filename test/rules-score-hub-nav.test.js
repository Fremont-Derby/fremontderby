import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('rules page league night CTAs', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  const i = src.indexOf('renderRulesPage');
  const chunk = src.slice(i, i + 5000);
  assert.match(chunk, /href="\/scorecard"/);
  assert.match(chunk, /href="\/availability"/);
  assert.match(chunk, /href="\/lineup"/);
});

test('score picker hub tools expanded', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/trades"/);
  assert.match(src, /href="\/playoffs"/);
  assert.match(src, /href="\/standings"/);
});
