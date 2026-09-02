import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/personaRouterEntry.js';

test('JFL GET /api/me/notifications returns an empty list instead of 404', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/api/me/notifications'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { notifications: [] });
});

test('JFL rejects non-GET on the notifications list', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/api/me/notifications', { method: 'POST' }),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 405);
});

test('JFL read-all is a no-op success', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/api/me/notifications/read-all', { method: 'POST' }),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
});
