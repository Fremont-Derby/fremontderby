import assert from 'node:assert/strict';
import test from 'node:test';
import { slotsToOpen, teamWinnerId } from '../src/druTeamResult.js';

test('a locked slot pair with no race opens that race', () => {
  const opens = slotsToOpen(
    { team_a_id: 'a', team_b_id: 'b' },
    [
      { team_id: 'a', slot_number: 1, player_id: 'left' },
      { team_id: 'b', slot_number: 1, player_id: 'right' },
      { team_id: 'a', slot_number: 2, player_id: null },
    ],
    [],
  );
  assert.deepEqual(opens, [{ slot_number: 1, player_a_id: 'left', player_b_id: 'right' }]);
});

test('a split table still names a winner so it can close', () => {
  const winner = teamWinnerId(
    { team_a_id: 'a', team_b_id: 'b' },
    [
      { status: 'finalized', winner_side: 'A' },
      { status: 'finalized', winner_side: 'B' },
    ],
  );
  assert.equal(winner, 'a');
});
