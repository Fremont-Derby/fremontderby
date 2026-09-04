import assert from 'node:assert/strict';
import test from 'node:test';
import { repairAdminPlayersScript } from '../src/adminPlayersScriptRepair.js';
import { repairAvailabilityScript } from '../src/availabilityScriptRepair.js';
import { repairAdminSeasonTeamsScript } from '../src/adminSeasonTeamsScriptRepair.js';
import { repairScorecardScript } from '../src/scorecardScriptRepair.js';
import { repairLineupScript } from '../src/lineupScriptRepair.js';

test('admin players repair restores confirm newlines', () => {
  const html = repairAdminPlayersScript("confirm(error.message+'Create a separate player with the same name anyway?')");
  assert.match(html, /\\n\\nCreate a separate player/);
});

test('availability repair prefers an upcoming night', () => {
  const source = "const requestedContext=contexts.find((context)=>context.roundId===requested);if(requestedContext)contextSelect.value=contextKey(requestedContext);else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;";
  assert.match(repairAvailabilityScript(source), /upcoming/);
});

test('season teams repair prefers the active season', () => {
  const source = "const requested=new URLSearchParams(location.search).get('season');if(requested&&seasons.some(item=>item.id===requested))seasonSelect.value=requested;";
  assert.match(repairAdminSeasonTeamsScript(source), /status==='active'/);
});

test('scorecard repair opens the requested match night', () => {
  const source = 'function selectRequestedMatch(){}filtersEl.hidden=false;populateMatchups();selectRequestedMatch()}';
  assert.match(repairScorecardScript(source), /honorRequestedMatchDate/);
});

test('lineup repair skips a finalized remembered night', () => {
  const source = "requestedRound&&rounds.some((round)=>round.roundId===requestedRound))return requestedRound;";
  assert.match(repairLineupScript(source), /finalized/);
});
