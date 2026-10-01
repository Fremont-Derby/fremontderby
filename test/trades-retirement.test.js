import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/routerEntry.js';

const tradeApiPaths = [
  '/api/me/trades',
  '/api/teams/team-1/trades',
  '/api/team-trades/trade-1/player-response',
  '/api/team-trades/trade-1/captain-approval',
  '/api/admin/teams/team-1/trades',
];

test('live Trades page renders before any legacy retirement path can run', async () => {
  const response = await worker.fetch(new Request('https://fremontderby.com/trades'), {}, {});
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(html, /Trades/i);
  assert.doesNotMatch(html, /This dog lost the rack/);
});

test('formal trade HTTP APIs require authentication instead of pretending to be retired', async () => {
  for (const pathname of tradeApiPaths) {
    const response = await worker.fetch(new Request(`https://fremontderby.com${pathname}`, {
      method: pathname === '/api/me/trades' || pathname === '/api/teams/team-1/trades' ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: pathname === '/api/me/trades' || pathname === '/api/teams/team-1/trades' ? undefined : '{}',
    }), {}, {});
    assert.equal(response.status, 401, pathname);
    const body = await response.json();
    assert.equal(typeof body.error, 'string', pathname);
  }
});
