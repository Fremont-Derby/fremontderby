import test from 'node:test';
import assert from 'node:assert/strict';
import { awayTeamLine } from '../src/awayTeamLine.js';

test('a match card names the away team', () => {
  assert.equal(awayTeamLine('Cue Crew'), 'Away: Cue Crew');
  assert.equal(awayTeamLine(''), 'Away team not set');
});
