import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceScoreAllowed, scoreNeedsBothTeams } from '../src/scoreFlow.js';

test('a practice score waits until both teams have a lineup', () => {
  assert.equal(scoreNeedsBothTeams({ teamAId: 'a' }).ok, false);
  assert.equal(scoreNeedsBothTeams({ teamAId: 'a', teamBId: 'b' }).ok, false);
  assert.equal(scoreNeedsBothTeams({ teamAId: 'a', teamBId: 'b', lineupA: true, lineupB: true }).ok, true);
});

test('a practice score waits for payment or a waiver', () => {
  assert.equal(practiceScoreAllowed([]).ok, false);
  assert.equal(practiceScoreAllowed([{ status: 'unpaid' }]).ok, false);
  assert.equal(practiceScoreAllowed([{ status: 'waived' }]).ok, true);
});
