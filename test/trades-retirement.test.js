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

test('legacy Trades page is a real 404 before the legacy renderer can run', async () => {
  const response = await worker.fetch(new Request('https://fremontderby.com/trades'), {}, {});
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(html, /Fremont Derby Trades/i);
});

test('formal trade HTTP APIs are unavailable without authenticating or touching data', async () => {
  for (const pathname of retiredApiPaths) {
    const response = await worker.fetch(new Request(`https://fremontderby.com${pathname}`, {
      method: pathname === '/api/me/trades' ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: pathname === '/api/me/trades' ? undefined : '{}',
    }), {}, {});
    assert.equal(response.status, 401, pathname);
    const body = await response.json();
    assert.match(String(body.error || ''), /Missing bearer token|sign-in|Unauthorized/i, pathname);
  }
});
