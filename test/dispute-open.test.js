import test from 'node:test';
import assert from 'node:assert/strict';
import { disputeOpen } from '../src/disputeOpen.js';

test('a scheduled match with no winner cannot be disputed', () => {
  assert.equal(disputeOpen({ status: 'scheduled', winner_team_id: null }), false);
  assert.equal(disputeOpen({ status: 'finalized', winner_team_id: 'team' }), true);
});
