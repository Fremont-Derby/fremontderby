import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('rules page league night CTAs', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  assert.match(src, /renderRulesPage/);
  assert.match(src, /href=\"\/scorecard\"|href=\"\/availability\"|href=\"\/schedule\"/);
});

test('score picker hub tools expanded', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /href=\"\/standings\"|href=\"\/playoffs\"|href=\"\/schedule\"/);
});
