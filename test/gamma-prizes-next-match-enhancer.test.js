import assert from 'node:assert/strict';
import test from 'node:test';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

test('gamma prizes enhancer injects next match without dropping season helper', async () => {
  const source = '<html><head></head><body><header></header><script>function preferredSeason(seasons) {\n      return seasons.find((season) => season.status === \'active\')\n        || seasons.find((season) => season.status === \'playoffs\')\n        || seasons.find((season) => season.status === \'registration\')\n        || seasons.find((season) => season.status === \'complete\')\n        || seasons[0]\n        || null;\n    }</script></body></html>';
  const response = await enhancePublicSeasonSelection(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    '/prizes',
  );
  const html = await response.text();
  assert.match(html, /choosePublicSeason/);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});

test('gamma standings enhancer injects next match', async () => {
  const source = '<html><head></head><body><header></header><script>const explicit=seasons.find((season)=>season.id===requestedSeasonId);const registration=seasons.find((season)=>season.status===\'registration\');const remembered=seasons.find((season)=>season.id===rememberedSeasonId);const selected=explicit||remembered||registration||seasons[0];seasonInput.value=selected?.id||\'\';</script></body></html>';
  const response = await enhancePublicSeasonSelection(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    '/standings',
  );
  const html = await response.text();
  assert.match(html, /data-next-match/);
  assert.match(html, /pickNextMatch/);
});
