import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeApiPathname } from '../src/pathAliases.js';

test('prizes empty states recover to standings', () => {
  const src = readFileSync(new URL('../src/prizesPage.js', import.meta.url), 'utf8');
  assert.match(src, /No projected payouts yet/);
  assert.match(src, /No finalized prizes yet/);
  assert.match(src, /href="\/standings"/);
});

test('postseason lineup path aliases', () => {
  assert.equal(
    normalizeApiPathname('/api/team-matches/abc/playoff-lineup'),
    '/api/team-matches/abc/postseason-lineup',
  );
});
