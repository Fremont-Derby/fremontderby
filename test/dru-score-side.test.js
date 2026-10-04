import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptedWinnerSide, raceResultPatch } from '../src/druScoreOpen.js';

test('a score side other than A or B is rejected', () => {
  assert.equal(acceptedWinnerSide('A'), 'A');
  assert.equal(acceptedWinnerSide('B'), 'B');
  assert.equal(acceptedWinnerSide('C'), '');
  assert.equal(raceResultPatch({ player_a_id: 'a', player_b_id: 'b' }, 'C'), null);
});
