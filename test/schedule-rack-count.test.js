import assert from 'node:assert/strict';
import test from 'node:test';
import { scheduleRackCount } from '../src/scheduleRackCount.js';

test('a saved race counts even when the race status is not finalized', () => {
  const tally = scheduleRackCount(
    { status: 'finalized', team_a_id: 'a', team_b_id: 'b', winner_team_id: 'a' },
    [{ winner_side: 'A', status: 'scheduled' }, { winner_side: 'A', status: 'scheduled' }, { winner_side: 'B', status: 'scheduled' }],
  );
  assert.deepEqual(tally, { A: 2, B: 1 });
});

test('a finalized match with a winner and no counted races shows 3-0', () => {
  const tally = scheduleRackCount(
    { status: 'finalized', team_a_id: 'a', team_b_id: 'b', winner_team_id: 'b' },
    [],
  );
  assert.deepEqual(tally, { A: 0, B: 3 });
});

test('an open match with no races stays 0-0', () => {
  assert.deepEqual(scheduleRackCount({ status: 'scheduled', team_a_id: 'a', team_b_id: 'b' }, []), { A: 0, B: 0 });
});
