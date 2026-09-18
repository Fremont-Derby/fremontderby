import assert from 'node:assert/strict';
import test from 'node:test';
import { repairAdminPlayersScript } from '../src/adminPlayersScriptRepair.js';
import { repairAvailabilityScript } from '../src/availabilityScriptRepair.js';
import { repairAdminSeasonTeamsScript } from '../src/adminSeasonTeamsScriptRepair.js';
import { repairLineupScript } from '../src/lineupScriptRepair.js';
import { repairStandingsPageScript } from '../src/standingsScriptRepair.js';

test('admin players confirm keeps a real newline', () => {
  const repaired = repairAdminPlayersScript("confirm(error.message+'Create a separate player with the same name anyway?')");
  assert.match(repaired, /\\n\\nCreate a separate player/);
});

test('availability repair prefers an upcoming night', () => {
  const source = `const requestedContext=contexts.find((context)=>context.roundId===requested);
  if(requestedContext)contextSelect.value=contextKey(requestedContext);
  else if(remembered&&contexts.some((context)=>contextKey(context)===remembered))contextSelect.value=remembered;
  else {
    const today=new Date().toISOString().slice(0,10);
    const withDate=contexts.filter((context)=>context.scheduledOn||context.scheduled_on);
    const tonight=withDate.find((context)=>(context.scheduledOn||context.scheduled_on)===today);
    const upcoming=withDate
      .filter((context)=>(context.scheduledOn||context.scheduled_on)>=today)
      .sort((a,b)=>String(a.scheduledOn||a.scheduled_on).localeCompare(String(b.scheduledOn||b.scheduled_on)))[0];
    const pick=tonight||upcoming||contexts[0];
    if(pick)contextSelect.value=contextKey(pick);
  }
  `;
  const repaired = repairAvailabilityScript(source);
  assert.match(repaired, /onOrAfterToday/);
  assert.match(repaired, /rememberedContext&&onOrAfterToday\(rememberedContext\)/);
  assert.doesNotMatch(
    repaired,
    /else if\(remembered&&contexts\.some\(\(context\)=>contextKey\(context\)===remembered\)\)contextSelect\.value=remembered;/,
  );
});

test('season teams repair prefers the active season', () => {
  const source = "const requested=new URLSearchParams(location.search).get('season');if(requested&&seasons.some(item=>item.id===requested))seasonSelect.value=requested;";
  assert.match(repairAdminSeasonTeamsScript(source), /status==='active'/);
});

test('lineup repair skips a finalized remembered night', () => {
  const source = "requestedRound&&rounds.some((round)=>round.roundId===requestedRound))return requestedRound;";
  assert.match(repairLineupScript(source), /finalized/);
});

test('standings repair is a no-op when braces already exist', () => {
  assert.equal(repairStandingsPageScript('already valid'), 'already valid');
});
