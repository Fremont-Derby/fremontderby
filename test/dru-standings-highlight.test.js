import assert from 'node:assert/strict';
import test from 'node:test';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

const standingsSource = `<html><head></head><body><header></header><script>const explicit=seasons.find((season)=>season.id===requestedSeasonId);const registration=seasons.find((season)=>season.status==='registration');const remembered=seasons.find((season)=>season.id===rememberedSeasonId);const selected=explicit||remembered||registration||seasons[0];seasonInput.value=selected?.id||'';</script></body></html>`;

const prizesSource = `<html><head></head><body><header></header><script>function preferredSeason(seasons) {
      const explicit = seasons.find((season) => season.id === requestedSeason);
      const remembered = seasons.find((season) => season.id === rememberedSeason);
      return explicit
        || remembered
        || seasons.find((season) => ['active', 'playoffs'].includes(season.status))
        || seasons.find((season) => season.status === 'registration')
        || seasons.find((season) => season.status === 'complete')
        || seasons[0];
    }</script></body></html>`;

test('DRU standings enhancer injects ?team= highlight hook', async () => {
  const response = await enhancePublicSeasonSelection(
    new Response(standingsSource, { headers: { 'content-type': 'text/html' } }),
    '/standings',
  );
  const html = await response.text();
  assert.match(html, /data-standings-highlight/);
  assert.match(html, /isRequestedStanding/);
  assert.match(html, /Showing team/);
});

test('DRU prizes enhancer injects ?team= highlight hook', async () => {
  const response = await enhancePublicSeasonSelection(
    new Response(prizesSource, { headers: { 'content-type': 'text/html' } }),
    '/prizes',
  );
  const html = await response.text();
  assert.match(html, /data-standings-highlight/);
  assert.match(html, /isRequestedStanding/);
});
