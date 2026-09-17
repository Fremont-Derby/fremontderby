import assert from 'node:assert/strict';
import test from 'node:test';
import { enhanceTeamsCanonicalActions } from '../src/teamsCanonicalActionsEnhancer.js';

test('teams enhancer still retires trades and injects next match', async () => {
  const source = '<html><body><header></header><a href="/trades">Roster & trades</a></body></html>';
  const response = await enhanceTeamsCanonicalActions(new Response(source, { headers: { 'content-type': 'text/html' } }));
  const html = await response.text();
  assert.match(html, /href="#captain-tools"/);
  assert.doesNotMatch(html, /href="\/trades"/);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});
