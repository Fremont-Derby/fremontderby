import test from 'node:test';
import assert from 'node:assert/strict';
import { standingsPlace } from '../src/standingsPlace.js';

test('a team with no matches does not get a place', () => {
  assert.equal(standingsPlace({ standings_rank: 1, games_played: 0 }), '');
  assert.equal(standingsPlace({ standings_rank: 1, games_played: 2 }), '1');
});
