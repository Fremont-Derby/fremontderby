import assert from 'node:assert/strict';
import test from 'node:test';
import { enhancePublicSeasonSelection } from '../src/publicSeasonSelectionEnhancer.js';

const PRIZES_SNIPPET = `function preferredSeason(seasons) {
      const explicit = seasons.find((season) => season.id === requestedSeason);
      const remembered = seasons.find((season) => season.id === rememberedSeason);
      return explicit
        || remembered
        || seasons.find((season) => ['active', 'playoffs'].includes(season.status))
        || seasons.find((season) => season.status === 'registration')
        || seasons.find((season) => season.status === 'complete')
        || seasons[0];
    }`;

test('prizes enhancer still rewrites preferredSeason and injects next match', async () => {
  const source = `<html><head></head><body><header></header><script>${PRIZES_SNIPPET}</script></body></html>`;
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
