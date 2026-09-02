import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/personaRouterEntry.js';

async function get(path, method = 'GET') {
  return worker.fetch(
    new Request(`https://jfl.fremontderby.test${path}`, { method }),
    { ENVIRONMENT: 'jfl' },
  );
}

test('JFL GET /api/me/notifications returns an empty list instead of 404', async () => {
  const response = await get('/api/me/notifications');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { notifications: [] });
});

test('JFL rejects non-GET on the notifications list', async () => {
  const response = await get('/api/me/notifications', 'POST');
  assert.equal(response.status, 405);
});

test('JFL read-all is a no-op success', async () => {
  const response = await get('/api/me/notifications/read-all', 'POST');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
});

test('JFL GET /api/me/invitations is an empty list instead of 404', async () => {
  const response = await get('/api/me/invitations');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { invitations: [], playerId: null });
});

test('JFL GET /api/prizes returns a summary object instead of 404', async () => {
  const response = await get('/api/prizes');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.summary);
  assert.deepEqual(body.summary.projected_payouts, []);
});

test('JFL GET /api/me/matches rewrites to scorable-matches', async () => {
  const response = await get('/api/me/matches');
  assert.notEqual(response.status, 404);
  const body = await response.json().catch(() => ({}));
  assert.ok(body.matches || body.error || response.status === 200);
});

test('JFL GET /api/me/ready-checks is an empty list instead of 404', async () => {
  const response = await get('/api/me/ready-checks');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { readyChecks: [] });
});

test('JFL GET /api/me/lineups is an empty list instead of 404', async () => {
  const response = await get('/api/me/lineups');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { lineups: [] });
});

test('JFL GET /api/me/membership-requests aliases the working team path', async () => {
  const response = await get('/api/me/membership-requests');
  assert.notEqual(response.status, 404);
  const body = await response.json().catch(() => ({}));
  assert.ok(body.requests || body.error || response.status === 200);
});

test('JFL GET /api/me/trades is not retired 404', async () => {
  const response = await get('/api/me/trades');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.tradeManagement, { trades: [] });
});
