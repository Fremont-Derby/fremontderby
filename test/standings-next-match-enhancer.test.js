import assert from 'node:assert/strict';
import test from 'node:test';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

const STANDINGS_SNIPPET = "const explicit=seasons.find((season)=>season.id===requestedSeasonId);const registration=seasons.find((season)=>season.status==='registration');const remembered=seasons.find((season)=>season.id===rememberedSeasonId);const selected=explicit||remembered||registration||seasons[0];seasonInput.value=selected?.id||'';";

test('standings enhancer still rewrites season default and injects next match', async () => {
  const source = `<html><head></head><body><header></header><script>${STANDINGS_SNIPPET}</script></body></html>`;
  const response = await enhancePublicSeasonSelection(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    '/standings',
  );
  const html = await response.text();
  assert.match(html, /choosePublicSeason/);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});
