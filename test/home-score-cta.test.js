import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('home has Score CTA without duplicate schedule', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  const introStart = src.indexOf('export function renderIntroPage');
  const rulesStart = src.indexOf('export function renderRulesPage');
  assert.ok(introStart >= 0 && rulesStart > introStart);
  const intro = src.slice(introStart, rulesStart);
  assert.equal((intro.match(/href="\/scorecard"/g) || []).length, 1);
  assert.match(intro, /href="\/availability"/);
  assert.match(intro, /href="\/schedule"/);
});

test('free-agent path aliases', () => {
  assert.equal(normalizeApiPathname('/api/seasons/abc/fa'), '/api/seasons/abc/free-agents');
  assert.equal(normalizeApiPathname('/api/me/fa'), '/api/me/teams');
});

test('teams invitations empty tip', () => {
  const src = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /When a captain invites you/);
});
