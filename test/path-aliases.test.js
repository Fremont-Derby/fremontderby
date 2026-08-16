import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiPathname, EXACT_PATH_ALIASES } from '../src/pathAliases.js';

test('exact aliases', () => {
  assert.equal(normalizeApiPathname('/api/me/matches'), '/api/me/scorable-matches');
  assert.equal(normalizeApiPathname('/api/me/dms'), '/api/me/direct-message-inbox');
});

test('segment aliases', () => {
  assert.equal(normalizeApiPathname('/api/seasons/abc/standings'), '/api/seasons/abc/team-standings');
  assert.equal(normalizeApiPathname('/api/teams/t1/chat'), '/api/teams/t1/messages');
  assert.equal(normalizeApiPathname('/api/team-matches/m1/chat'), '/api/team-matches/m1/messages');
});

test('non-api paths unchanged', () => {
  assert.equal(normalizeApiPathname('/teams'), '/teams');
});

test('exact map is non-empty catalog for #950', () => {
  assert.ok(Object.keys(EXACT_PATH_ALIASES).length >= 5);
});
