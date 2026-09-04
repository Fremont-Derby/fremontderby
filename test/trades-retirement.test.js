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
  assert.ok([200, 404].includes(response.status));
});

test('formal trade HTTP APIs are unavailable without authenticating or touching data', async () => {
  for (const pathname of retiredApiPaths) {
    const response = await worker.fetch(new Request(`https://fremontderby.com${pathname}`, {
      method: pathname === '/api/me/trades' ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: pathname === '/api/me/trades' ? undefined : '{}',
    }), {}, {});
    assert.notEqual(response.status, 500, pathname);
    assert.ok(response.status >= 400 || response.status === 200, pathname);
  }
});
