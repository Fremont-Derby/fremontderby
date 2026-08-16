import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('home has Score CTA without duplicate schedule', () => {
  const src = readFileSync(new URL('../src/publicPages.js', import.meta.url), 'utf8');
  assert.equal((src.match(/href="\/scorecard"/g) || []).length, 1);
  assert.match(src, /href="\/availability"/);
  assert.match(src, /href="\/schedule"/);
});

test('free-agent path aliases', () => {
  assert.equal(normalizeApiPathname('/api/seasons/abc/fa'), '/api/seasons/abc/free-agents');
  assert.equal(normalizeApiPathname('/api/me/fa'), '/api/me/teams');
});

test('teams invitations empty tip', () => {
  const src = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /When a captain invites you/);
});
