import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreDateMiss, lineupBothTeams } from '../src/scoreDateMiss.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';
import { renderLineupPage } from '../src/lineupPage.js';

test('a missing score date and both lineup teams are named', () => {
  assert.equal(scoreDateMiss({ found: false }), 'That date is not on this score list.');
  assert.equal(lineupBothTeams({ home: 'Owls', away: 'Pines' }), 'Owls vs Pines.');
  assert.match(renderScorePickerPage(), /That date is not on this score list/);
  assert.match(renderLineupPage(), /Owls vs Pines/);
});
