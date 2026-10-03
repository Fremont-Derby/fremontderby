import test from 'node:test';
import assert from 'node:assert/strict';
import { championshipLine } from '../src/championshipLine.js';

test('a finalized championship names the winner', () => {
  assert.equal(championshipLine({
    stage: 'championship',
    status: 'finalized',
    winnerTeamId: 'kids',
    teamAId: 'kids',
    teamAName: 'Paper Compass Kids',
    teamBId: 'compass',
    teamBName: 'Pocket Compass',
  }), 'Paper Compass Kids won the championship.');
  assert.equal(championshipLine({ stage: 'championship', status: 'scheduled', teamAName: 'Pocket Compass' }), '');
  assert.equal(championshipLine({ stage: 'semifinal', status: 'finalized', winnerTeamId: 'kids', teamAId: 'kids', teamAName: 'Paper Compass Kids' }), '');
});
