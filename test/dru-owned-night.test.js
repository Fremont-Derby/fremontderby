import test from 'node:test';
import assert from 'node:assert/strict';
import { championshipLine, playoffMatches, playoffPadName, playoffRacesOpened, raceFinished } from '../src/druOwnedNight.js';

test('owned night rules stay in one place', () => {
  assert.equal(raceFinished({ status: 'in_progress', match_winner_side: 'A' }), true);
  assert.equal(playoffPadName('match-aaaa'), 'Kite String aaaa');
  assert.equal(playoffRacesOpened([{ team_id: 'a' }, { team_id: 'b' }], [], 'a', 'b').text, 'Playoff races were not created.');
  assert.equal(championshipLine({ stage: 'championship', status: 'finalized', winnerTeamId: 'kids', teamAId: 'kids', teamAName: 'Paper Compass Kids' }), 'Paper Compass Kids won the championship.');
  assert.equal(playoffMatches([{ stage: 'semifinal', matches: [{ teamAName: 'Lemon Kite Kids', teamBName: 'Pocket Compass' }] }])[0].teams[0], 'Lemon Kite Kids');
});
