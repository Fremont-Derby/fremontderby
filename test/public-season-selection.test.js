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

test('public season policy keeps explicit selection authoritative and lifecycle relevance ahead of remembered defaults', () => {
  assert.equal(choosePublicSeason(seasons, { explicitId: 'complete' }).id, 'complete');
  assert.equal(choosePublicSeason(seasons, { rememberedId: 'registration' }).id, 'active');
  assert.equal(choosePublicSeason(seasons).id, 'active');
  assert.equal(choosePublicSeason(seasons.filter((season) => season.id !== 'active')).id, 'playoffs');
  assert.equal(choosePublicSeason(seasons.filter((season) => !['active', 'playoffs'].includes(season.id))).id, 'registration');
  assert.equal(choosePublicSeason([{ id: 'old', status: 'complete' }]).id, 'old');
  assert.equal(
    choosePublicSeason(
      [{ id: 'future', status: 'draft' }, { id: 'remembered', status: 'draft' }],
      { rememberedId: 'remembered' },
    ).id,
    'remembered',
  );
  assert.equal(choosePublicSeason([]), null);
});

function htmlResponse(html, nonce = 'test-nonce') {
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': `script-src 'nonce-${nonce}'`,
    },
  });
}

test('Schedule, Standings, and Prizes are rewritten to consume one shared browser policy', async () => {
  const schedule = await enhancePublicSeasonSelection(htmlResponse(`<!doctype html><head><script nonce="test-nonce">window.ready=true</script></head><script nonce="test-nonce">const query=new URLSearchParams(location.search);const requestedSeason=query.get('season')||localStorage.getItem('fd.scheduleSeasonId')||'';const requestedRound=query.get('round')||localStorage.getItem('fd.scheduleRoundId')||'';let seasons=[];let rounds=[];const current=seasons.find((season)=>['active','playoffs'].includes(season.status))||seasons[0];seasonSelect.value=requestedSeason&&seasons.some((season)=>season.id===requestedSeason)?requestedSeason:current.id;seasonSelect.disabled=false</script>`), '/schedule');
  const scheduleHtml = await schedule.text();
  assert.match(scheduleHtml, /nonce="test-nonce"[^>]*>window\.choosePublicSeason=/);
  assert.match(scheduleHtml, /var choosePublicSeason=window\.choosePublicSeason/);
  assert.match(scheduleHtml, /const rememberedSeason=localStorage\.getItem\('fd\.scheduleSeasonId'\)/);
  assert.match(scheduleHtml, /choosePublicSeason\(seasons,\{explicitId:requestedSeason,rememberedId:rememberedSeason\}\)/);

  const standings = await enhancePublicSeasonSelection(htmlResponse(`<!doctype html><head><script nonce="test-nonce"></script></head><script nonce="test-nonce">const explicit=seasons.find((season)=>season.id===requestedSeasonId);const registration=seasons.find((season)=>season.status==='registration');const remembered=seasons.find((season)=>season.id===rememberedSeasonId);const selected=explicit||remembered||registration||seasons[0];seasonInput.value=selected?.id||'';</script>`), '/standings');
  assert.match(await standings.text(), /choosePublicSeason\(seasons,\{explicitId:requestedSeasonId,rememberedId:rememberedSeasonId\}\)/);

  const prizes = await enhancePublicSeasonSelection(htmlResponse(`<!doctype html><head><script nonce="test-nonce"></script></head><script nonce="test-nonce">function preferredSeason(seasons) {
      return seasons.find((season) => season.status === 'active')
        || seasons.find((season) => season.status === 'playoffs')
        || seasons.find((season) => season.status === 'registration')
        || seasons.find((season) => season.status === 'complete')
        || seasons[0]
        || null;
    }</script>`), '/prizes');
  const prizesHtml = await prizes.text();
  assert.match(prizesHtml, /return choosePublicSeason\(seasons, \{ explicitId: requestedSeason, rememberedId: rememberedSeason \}\);/);
  assert.match(prizesHtml, /nonce="test-nonce"[^>]*>window\.choosePublicSeason=/);
});
