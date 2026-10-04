import test from 'node:test';
import assert from 'node:assert/strict';
import { lineupTeamStatus } from '../src/lineupTeamStatus.js';

test('a lineup status names the team', () => {
  assert.equal(lineupTeamStatus('Rail Riders', 'submitted'), 'Rail Riders lineup is submitted.');
  assert.equal(lineupTeamStatus('', 'open'), '');
});
