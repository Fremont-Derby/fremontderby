import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiPathname } from '../src/pathAliases.js';
import { readFileSync } from 'node:fs';

test('score and lineup convenience aliases', () => {
  assert.equal(normalizeApiPathname('/api/me/lineups'), '/api/me/teams');
  assert.equal(normalizeApiPathname('/api/me/captain-teams'), '/api/me/teams');
  assert.equal(normalizeApiPathname('/api/me/scorecard'), '/api/me/scorable-matches');
  assert.equal(normalizeApiPathname('/api/score/matches'), '/api/me/scorable-matches');
});

test('score picker marks league night hub', () => {
  const src = readFileSync(new URL('../src/scorePickerPage.js', import.meta.url), 'utf8');
  assert.match(src, /League night/);
});
