import assert from 'node:assert/strict';
import test from 'node:test';
import { repairScorecardScript } from '../src/scorecardScriptRepair.js';

test('scorecard repair still honors the requested match date', () => {
  const source = '<html><body><header></header><script>function selectRequestedMatch(){}filtersEl.hidden=false;populateMatchups();selectRequestedMatch()}</script></body></html>';
  const html = repairScorecardScript(source);
  assert.match(html, /function honorRequestedMatchDate/);
  assert.match(html, /void honorRequestedMatchDate\(\)/);
});

test('scorecard repair injects next match from /api/me/matches', () => {
  const source = '<html><body><header></header><script>function selectRequestedMatch(){}filtersEl.hidden=false;populateMatchups();selectRequestedMatch()}</script></body></html>';
  const html = repairScorecardScript(source);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});
