import test from 'node:test';
import assert from 'node:assert/strict';
import { lineupTeamNames } from '../src/lineupTeamNames.js';

test('lineup status names both teams', () => {
  assert.equal(lineupTeamNames('Balloon String', 'Star Chart'), 'Balloon String vs Star Chart');
});
