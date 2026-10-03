import test from 'node:test';
import assert from 'node:assert/strict';
import { championshipLine, raceFinished } from '../src/druResultsGroup.js';

test('results group rules', () => {
  assert.equal(raceFinished({ status: 'in_progress', match_winner_side: 'A' }), true);
  assert.equal(championshipLine({ stage: 'championship', status: 'finalized', winnerTeamId: 'kids', teamAId: 'kids', teamAName: 'Paper Compass Kids' }), 'Paper Compass Kids won the championship.');
});
