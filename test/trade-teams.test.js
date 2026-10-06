import test from 'node:test';
import assert from 'node:assert/strict';
import { tradeTeams } from '../src/tradeTeams.js';

test('trades can list the other teams', () => {
  const teams = tradeTeams([{ teamId: 'a', teamName: 'Grubb Pony Crew 0111' }, {}]);
  assert.equal(teams.length, 1);
  assert.equal(teams[0].teamName, 'Grubb Pony Crew 0111');
});
