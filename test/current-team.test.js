import test from 'node:test';
import assert from 'node:assert/strict';
import { currentTeams } from '../src/currentTeam.js';

test('profile does not list an ended team', () => {
  const teams = currentTeams([{ teamName: 'Acorn Cue', endsAt: '2026-10-01' }, { teamName: 'Sandyman Took Crew 0103' }]);
  assert.equal(teams.length, 1);
  assert.equal(teams[0].teamName, 'Sandyman Took Crew 0103');
});
