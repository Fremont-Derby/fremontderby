import test from 'node:test';
import assert from 'node:assert/strict';

import { choosePublicSeason } from '../src/publicSeasonSelection.js';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

const seasons = [
  { id: 'complete', status: 'complete' },
  { id: 'registration', status: 'registration' },
  { id: 'active', status: 'active' },
  { id: 'playoffs', status: 'playoffs' },
];

test('public season policy preserves explicit and remembered selections before lifecycle defaults', () => {
  assert.equal(choosePublicSeason(seasons, { explicitId: 'complete' }).id, 'complete');
  assert.equal(choosePublicSeason(seasons, { rememberedId: 'registration' }).id, 'registration');
  assert.equal(choosePublicSeason(seasons).id, 'active');
  assert.equal(choosePublicSeason(seasons.filter((season) => season.id !== 'active')).id, 'playoffs');
  assert.equal(choosePublicSeason(seasons.filter((season) => !['active', 'playoffs'].includes(season.id))).id, 'registration');
  assert.equal(choosePublicSeason([{ id: 'old', status: 'complete' }]).id, 'old');
  assert.equal(choosePublicSeason([]), null);
});

function htmlResponse(html) {
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

test('Schedule, Standings, and Prizes are rewritten to consume one shared browser policy', async () => {
  const schedule = await enhancePublicSeasonSelection(htmlResponse(`<!doctype html><head></head><script>const query=new URLSearchParams(location.search);const requestedSeason=query.get('season')||localStorage.getItem('fd.scheduleSeasonId')||'';const requestedRound=query.get('round')||localStorage.getItem('fd.scheduleRoundId')||'';let seasons=[];let rounds=[];const current=seasons.find((season)=>['active','playoffs'].includes(season.status))||seasons[0];seasonSelect.value=requestedSeason&&seasons.some((season)=>season.id===requestedSeason)?requestedSeason:current.id;seasonSelect.disabled=false</script>`), '/schedule');
  const scheduleHtml = await schedule.text();
  assert.match(scheduleHtml, /const choosePublicSeason=/);
  assert.match(scheduleHtml, /const rememberedSeason=localStorage\.getItem\('fd\.scheduleSeasonId'\)/);
  assert.match(scheduleHtml, /choosePublicSeason\(seasons,\{explicitId:requestedSeason,rememberedId:rememberedSeason\}\)/);

  const standings = await enhancePublicSeasonSelection(htmlResponse(`<!doctype html><head></head><script>const explicit=seasons.find((season)=>season.id===requestedSeasonId);const registration=seasons.find((season)=>season.status==='registration');const remembered=seasons.find((season)=>season.id===rememberedSeasonId);const selected=explicit||remembered||registration||seasons[0];seasonInput.value=selected?.id||'';</script>`), '/standings');
  assert.match(await standings.text(), /choosePublicSeason\(seasons,\{explicitId:requestedSeasonId,rememberedId:rememberedSeasonId\}\)/);

  const prizes = await enhancePublicSeasonSelection(htmlResponse(`<!doctype html><head></head><script>function preferredSeason(seasons) {\n      const explicit = seasons.find((season) => season.id === requestedSeason);\n      const remembered = seasons.find((season) => season.id === rememberedSeason);\n      return explicit\n        || remembered\n        || seasons.find((season) => ['active', 'playoffs'].includes(season.status))\n        || seasons.find((season) => season.status === 'registration')\n        || seasons.find((season) => season.status === 'complete')\n        || seasons[0];\n    }</script>`), '/prizes');
  assert.match(await prizes.text(), /return choosePublicSeason\(seasons, \{ explicitId: requestedSeason, rememberedId: rememberedSeason \}\);/);
});
