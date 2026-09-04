import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/routerEntry.js';

const retiredApiPaths = [
  '/api/me/trades',
  '/api/teams/team-1/trades',
  '/api/team-trades/trade-1/player-response',
  '/api/team-trades/trade-1/captain-approval',
  '/api/admin/teams/team-1/trades',
];

test('public /trades page is a session-backed HTML shell, not a 404 hound', async () => {
  const response = await worker.fetch(new Request('https://dru.fremontderby.com/trades'), { ENVIRONMENT: 'dru' }, {});
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(html, /Fremont Derby Trades/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.doesNotMatch(html, /This dog lost the rack/);
  assert.doesNotMatch(html, /Access token/i);
  assert.doesNotMatch(html, /data-token/);
});

test('formal trade HTTP APIs are unavailable without authenticating or touching data', async () => {
  for (const pathname of retiredApiPaths) {
    const response = await worker.fetch(new Request(`https://fremontderby.com${pathname}`, {
      method: pathname === '/api/me/trades' ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: pathname === '/api/me/trades' ? undefined : '{}',
    }), {}, {});
    assert.equal(response.status, 404, pathname);
    assert.deepEqual(await response.json(), { error: 'Not found' }, pathname);
  }
});
