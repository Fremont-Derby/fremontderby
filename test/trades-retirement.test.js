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

test('public /trades is retired, not a player-trade shell', async () => {
  const response = await worker.fetch(new Request('https://dru.fremontderby.com/trades'), { ENVIRONMENT: 'dru' }, {});
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.doesNotMatch(html, /Fremont Derby Trades/);
  assert.doesNotMatch(html, /Propose trade/);
  assert.doesNotMatch(html, /data-trade-form/);
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
