import test from 'node:test';
import assert from 'node:assert/strict';
import { finishRemainingLabel, mergeScorableMatches, openScoringLabel, raceInserts, scoreRowsForMatch } from '../src/druScoreOpen.js';

test('a scheduled match can be opened for scoring without a captain login', () => {
  assert.equal(openScoringLabel(), 'Open this match for scoring');
  assert.equal(finishRemainingLabel(), 'Finish remaining regular matches');
  const rows = scoreRowsForMatch({ id: 'match-1', team_a_name: 'Clover Cups', team_b_name: 'Ribbon Boats', team_a_id: 'a', round_number: 1, scheduled_on: '2026-10-07' });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].team_match_id, 'match-1');
  const merged = mergeScorableMatches([{ player_match_id: 'already' }], rows);
  assert.equal(merged.length, 4);
});

test('opening a match writes a race for each paired roster player', () => {
  const rows = raceInserts(
    { id: 'match-1', season_id: 'season-1', round_id: 'round-1', team_a_id: 'home', team_b_id: 'away' },
    ['a1', 'a2'],
    ['b1', 'b2', 'b3'],
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].player_a_id, 'a1');
  assert.equal(rows[1].player_b_id, 'b2');
  assert.equal(rows[0].status, 'scheduled');
});
