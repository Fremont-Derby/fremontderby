import assert from 'node:assert/strict';
import test from 'node:test';

import { enhanceTeamsCanonicalActions } from '../src/teamsCanonicalActionsEnhancer.js';
import routerEntry from '../src/routerEntry.js';

test('Teams canonical-action enhancer removes legacy availability and trades destinations', async () => {
  const source = '<html><body><a href="/availability">Availability</a><a href="/trades">Roster & trades</a><div data-captain-teams></div><script>hubManage.href=\'/trades\';</script></body></html>';
  const response = await enhanceTeamsCanonicalActions(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const html = await response.text();

  assert.match(html, /href="\/schedule"/);
  assert.match(html, /href="#captain-tools"/);
  assert.match(html, /id="captain-tools" data-captain-teams/);
  assert.doesNotMatch(html, /href="\/availability"/);
  assert.doesNotMatch(html, /href="\/trades"/);
  assert.doesNotMatch(html, /Roster & trades/);
});

test('Teams runtime hub points availability to Schedule and roster management stays on Teams', async () => {
  const response = await routerEntry.fetch(new Request('https://fremontderby.test/teams'), {}, {});
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /data-hub-availability href="\/schedule"/);
  assert.match(html, /data-hub-manage href="#captain-tools"/);
  assert.match(html, />Roster management</);
  assert.match(html, /Handle invites, requests, and roster changes\./);
  assert.match(html, /Message your team or players directly\./);
  assert.doesNotMatch(html, /data-hub-availability href="\/availability"/);
  assert.doesNotMatch(html, /data-hub-manage href="\/trades"/);
});
