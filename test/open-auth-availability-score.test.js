import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('availability signedApi allows open-auth lanes without Google token', () => {
  const src = readFileSync(new URL('../src/availabilityPage.js', import.meta.url), 'utf8');
  assert.match(src, /isOpenAuthLane/);
  assert.match(src, /if\(!token&&!isOpenAuthLane\(\)\)/);
  assert.match(src, /if\(token\)headers\.authorization/);
});

test('teams hub fetches scorable matches on open-auth lanes without token', () => {
  const src = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(src, /token\|\|openLane/);
  assert.match(src, /scorable-matches/);
});
