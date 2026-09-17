import assert from 'node:assert/strict';
import test from 'node:test';
import { enhanceTeamsCanonicalActions } from '../src/teamsCanonicalActionsEnhancer.js';

test('teams enhancer injects ?team= highlight hook', async () => {
  const source = '<html><head></head><body><header></header><div data-captain-teams></div></body></html>';
  const response = await enhanceTeamsCanonicalActions(new Response(source, { headers: { 'content-type': 'text/html' } }));
  const html = await response.text();
  assert.match(html, /data-team-highlight/);
  assert.match(html, /isRequestedTeam/);
  assert.match(html, /Showing team/);
});
