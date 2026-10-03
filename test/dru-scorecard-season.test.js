import test from 'node:test';
import assert from 'node:assert/strict';
import { repairScorecardScript } from '../src/scorecardScriptRepair.js';
import { scorecardMatchLabel, seasonsForRequestedMatch } from '../src/druScorecardSeason.js';

test('the scorecard searches the requested season before Season 1', () => {
  const ordered = seasonsForRequestedMatch(
    [{ id: 'season-1', name: 'Season 1' }, { id: 'kids', name: 'Kids Demo Night' }],
    'kids',
  );
  assert.equal(ordered[0].name, 'Kids Demo Night');
  assert.equal(scorecardMatchLabel(
    { teamAName: 'Bluebird Break', teamBName: 'Sunny Rail Ducks' },
    { roundNumber: 1 },
  ), 'Bluebird Break vs Sunny Rail Ducks · Round 1');
  const html = repairScorecardScript('<html><body><select data-date></select><script>function selectRequestedMatch(){filtersEl.hidden=false;populateMatchups();selectRequestedMatch()}</script></body></html>');
  assert.match(html, /Opened /);
  assert.doesNotMatch(html, /status==='active'/);
  assert.match(html, /data-dru-season/);
});

