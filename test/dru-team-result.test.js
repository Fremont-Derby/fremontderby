import test from 'node:test';
import assert from 'node:assert/strict';
import { teamWinnerId } from '../src/druTeamResult.js';

test('a DRU team result follows the finished races', () => {
  const match = { team_a_id: 'alley', team_b_id: 'rail' };
  assert.equal(teamWinnerId(match, [
    { status: 'finalized', winner_side: 'B' },
    { status: 'finalized', winner_side: 'B' },
  ]), 'rail');
  assert.equal(teamWinnerId(match, [
    { status: 'finalized', winner_side: 'B' },
    { status: 'in_progress', winner_side: null },
  ]), null);
});

test('a practice result waits until both teams are set', () => {
  assert.equal(teamWinnerId({ team_a_id: 'a' }, [{ status: 'finalized', winner_side: 'A' }]), null);
});
