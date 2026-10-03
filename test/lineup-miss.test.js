import test from 'node:test';
import assert from 'node:assert/strict';
import { lineupMissLine } from '../src/lineupMiss.js';
import { renderLineupPage } from '../src/lineupPage.js';

test('a lineup miss is named only after every captained team is checked', () => {
  assert.equal(lineupMissLine({ captainTeams: ['Owls', 'Pines'], checkedTeams: ['Owls'], matchFound: false }), '');
  assert.equal(lineupMissLine({ captainTeams: ['Owls', 'Pines'], checkedTeams: ['Owls', 'Pines'], matchFound: false }), 'This match is not on your teams.');
  assert.doesNotMatch(renderLineupPage(), /This match is not on your teams/);
});
