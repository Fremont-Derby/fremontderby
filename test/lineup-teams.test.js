import test from 'node:test';
import assert from 'node:assert/strict';
import { lineupTeamsLine } from '../src/lineupTeams.js';
import { renderLineupPage } from '../src/lineupPage.js';

test('a lineup names both teams', () => {
  assert.equal(lineupTeamsLine({ teamA: 'Owls', teamB: 'Foxes' }), 'Lineup: Owls and Foxes.');
  assert.doesNotMatch(renderLineupPage(), /Lineup: Owls and Foxes/);
});
