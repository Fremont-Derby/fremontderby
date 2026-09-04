import assert from 'node:assert/strict';
import test from 'node:test';
import { repairScorecardScript } from '../src/scorecardScriptRepair.js';

test('scorecard repair opens the requested match night', () => {
  const source = 'function selectRequestedMatch(){}filtersEl.hidden=false;populateMatchups();selectRequestedMatch()}';
  const repaired = repairScorecardScript(source);
  assert.match(repaired, /honorRequestedMatchDate/);
  assert.match(repaired, /\/api\/seasons/);
});
