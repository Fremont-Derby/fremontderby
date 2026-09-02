import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeApiPathname,
  normalizePagePathname,
  EXACT_PATH_ALIASES,
  EXACT_PAGE_ALIASES,
} from '../src/pathAliases.js';

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
  assert.equal(normalizePagePathname('/availability'), '/availability');
  assert.equal(normalizePagePathname('/standings/'), '/standings');
});

test('exact map is non-empty catalog for #950', () => {
  assert.ok(Object.keys(EXACT_PATH_ALIASES).length >= 5);
  assert.ok(Object.keys(EXACT_PAGE_ALIASES).length >= 8);
});

test('HTML page aliases rewrite to canonical routes', () => {
  assert.equal(normalizePagePathname('/player'), '/players');
  assert.equal(normalizePagePathname('/check-in'), '/availability');
  assert.equal(normalizePagePathname('/checkin'), '/availability');
  assert.equal(normalizePagePathname('/schedules'), '/schedule');
  assert.equal(normalizePagePathname('/playoff'), '/playoffs');
  assert.equal(normalizePagePathname('/prize'), '/prizes');
  assert.equal(normalizePagePathname('/trade'), '/trades');
  assert.equal(normalizePagePathname('/chat'), '/messages');
  assert.equal(normalizePagePathname('/roster'), '/teams');
  assert.equal(normalizePagePathname('/score'), '/scorecard');
  assert.equal(normalizePagePathname('/scoring'), '/scorecard');
  assert.equal(normalizePagePathname('/scorecards'), '/scorecard');
  assert.equal(normalizePagePathname('/inbox'), '/messages');
  assert.equal(normalizePagePathname('/lineups'), '/lineup');
  assert.equal(normalizePagePathname('/bracket'), '/playoffs');
  assert.equal(normalizePagePathname('/notify'), '/notifications');
  assert.equal(normalizePagePathname('/home'), '/');
  assert.equal(normalizePagePathname('/score/'), '/scorecard');
  assert.equal(normalizePagePathname('/practice'), '/schedule');
  assert.equal(normalizePagePathname('/practices'), '/schedule');
  assert.equal(normalizePagePathname('/subs'), '/teams');
  assert.equal(normalizePagePathname('/account'), '/profile');
  assert.equal(normalizePagePathname('/venues'), '/rules');
  assert.equal(normalizePagePathname('/stats'), '/standings');
  assert.equal(normalizeApiPathname('/check-in'), '/availability');
});
