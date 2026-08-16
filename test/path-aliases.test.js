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

test('trades and playoffs convenience aliases', () => {
  assert.equal(normalizeApiPathname('/api/trades'), '/api/me/trades');
  assert.equal(
    normalizeApiPathname('/api/seasons/abc/playoffs'),
    '/api/seasons/abc/schedule',
  );
});

test('profile and join path aliases', () => {
  assert.equal(normalizeApiPathname('/api/me/standing-availability'), '/api/me/profile/standing-availability');
  assert.equal(normalizeApiPathname('/api/me/player-profile'), '/api/me/profile');
  assert.equal(
    normalizeApiPathname('/api/teams/abc/membership-requests'),
    '/api/teams/abc/membership-request',
  );
  assert.equal(
    normalizeApiPathname('/api/teams/abc/join'),
    '/api/teams/abc/membership-request',
  );
});

test('free-agents aliases', () => {
  assert.equal(
    normalizeApiPathname('/api/seasons/s1/eligible-free-agents'),
    '/api/seasons/s1/free-agents',
  );
  assert.equal(
    normalizeApiPathname('/api/seasons/s1/free_agents'),
    '/api/seasons/s1/free-agents',
  );
});

test('direct message path aliases', () => {
  assert.equal(
    normalizeApiPathname('/api/direct-messages/c1'),
    '/api/direct-conversations/c1/messages',
  );
  assert.equal(
    normalizeApiPathname('/api/direct-messages/c1/read'),
    '/api/direct-conversations/c1/messages/read',
  );
  assert.equal(
    normalizeApiPathname('/api/dms/c1'),
    '/api/direct-conversations/c1/messages',
  );
});

test('practice and fa short aliases', () => {
  assert.equal(
    normalizeApiPathname('/api/teams/t1/practice-schedule'),
    '/api/teams/t1/practice',
  );
  assert.equal(
    normalizeApiPathname('/api/seasons/s1/fa'),
    '/api/seasons/s1/free-agents',
  );
});
