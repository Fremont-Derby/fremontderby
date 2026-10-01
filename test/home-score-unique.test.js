import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('home has exactly one Score CTA', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  const introStart = src.indexOf('export function renderIntroPage');
  const rulesStart = src.indexOf('export function renderRulesPage');
  assert.ok(introStart >= 0 && rulesStart > introStart);
  const intro = src.slice(introStart, rulesStart);
  assert.equal((intro.match(/href="\/scorecard"/g) || []).length, 1);
  assert.match(intro, /href="\/availability"/);
  assert.match(intro, /href="\/schedule"/);
});
