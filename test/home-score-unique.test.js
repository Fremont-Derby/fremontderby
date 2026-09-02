import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('home has exactly one Score CTA', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  const intro = src.slice(src.indexOf('export function renderIntroPage'), src.indexOf('export function renderRulesPage'));
  const rules = src.slice(src.indexOf('export function renderRulesPage'));
  assert.equal((intro.match(/href="\/scorecard"/g) || []).length, 1);
  assert.equal((rules.match(/href="\/scorecard"/g) || []).length, 1);
  assert.match(intro, /href="\/availability"/);
  assert.match(intro, /href="\/schedule"/);
});
