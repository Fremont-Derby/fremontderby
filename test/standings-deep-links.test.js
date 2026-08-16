import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('standings deep-link players and teams', () => {
  const src = readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  assert.match(src, /function playerLink/);
  assert.match(src, /function teamLink/);
  assert.match(src, /playerNameTd/);
  assert.match(src, /teamNameTd/);
});

test('lineup accepts match query param', () => {
  const src = readFileSync(new URL('../src/lineupPage.js', import.meta.url), 'utf8');
  assert.match(src, /requestedMatch/);
  assert.match(src, /teamMatchId/);
});
