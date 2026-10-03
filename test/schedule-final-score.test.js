import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleFinalScore } from '../src/scheduleFinalScore.js';

test('a finished schedule match shows the rack score', () => {
  assert.equal(scheduleFinalScore({ homeRacks: 2, awayRacks: 1 }), '2-1');
  assert.equal(scheduleFinalScore({ home_racks: 0, away_racks: 0 }), '');
  assert.equal(scheduleFinalScore({}), '');
});
