import test from 'node:test';
import assert from 'node:assert/strict';
import { playoffMatches, raceFinished, scorecardStatus } from '../src/druCloseTable.js';

test('a race with a match winner is finished even if the card still says in progress', () => {
  const row = { status: 'in_progress', winner_side: 'A', match_winner_side: 'A' };
  assert.equal(raceFinished(row), true);
  assert.equal(scorecardStatus(row), 'finalized');
});

test('an open rack is not a finished race', () => {
  assert.equal(raceFinished({ status: 'in_progress', winner_side: 'A', match_winner_side: null }), false);
});

test('playoff feed matches are listed', () => {
  const rows = playoffMatches([{ stage: 'semifinal', matches: [{ teamAName: 'Lemon Kite Kids', teamBName: 'Pocket Compass', status: 'finalized' }] }]);
  assert.equal(rows[0].teams[0], 'Lemon Kite Kids');
});
