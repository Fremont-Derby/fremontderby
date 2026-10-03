import test from 'node:test';
import assert from 'node:assert/strict';
import { finishRemainingLabel, mergeScorableMatches, openScoringLabel, scoreRowsForMatch } from '../src/druScoreOpen.js';

test('a scheduled match can be opened for scoring without a captain login', () => {
  assert.equal(openScoringLabel(), 'Open this match for scoring');
  assert.equal(finishRemainingLabel(), 'Finish remaining regular matches');
  const rows = scoreRowsForMatch({ id: 'match-1', team_a_name: 'Clover Cups', team_b_name: 'Ribbon Boats', team_a_id: 'a', round_number: 1, scheduled_on: '2026-10-07' });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].team_match_id, 'match-1');
  const merged = mergeScorableMatches([{ player_match_id: 'already' }], rows);
  assert.equal(merged.length, 4);
});
