import test from 'node:test';
import assert from 'node:assert/strict';
import { routeSeasonCreationOperation } from '../src/seasonCreationOperationHttp.js';

const id = '36520000-5000-4000-8000-000000000001';
const env = { ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://fixture.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server', SUPABASE_PUBLISHABLE_KEY: 'synthetic-public', SUPABASE_SCHEMA: 'jfl' };
const request = (operation = id, method = 'GET', token = 'synthetic-session') => new Request(
  'https://fixture.invalid/api/admin/season-creation-operations/' + operation,
  { method, headers: token ? { authorization: 'Bearer ' + token } : {} },
);
function fixture(result, status = 200, retryAfter) {
  const calls = [];
  return { calls, fetch: async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: 'current-actor' });
    calls.push({ url, body: JSON.parse(options.body), headers: options.headers });
    return Response.json(result, { status, headers: retryAfter === undefined ? {} : { 'retry-after': retryAfter } });
  } };
}
test('owned result is noncacheable and read RPC binds validated current actor', async () => {
  const result = { setup: { id: 'season', name: 'Later edited name' }, requestedInput: { configured_purpose: 'qa' } };
  const f = fixture(result);
  const response = await routeSeasonCreationOperation(request(), env, f);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { operationId: id, found: true, ...result });
  assert.equal(f.calls.length, 1);
  assert.match(f.calls[0].url, /\/read_season_creation_operation$/);
  assert.deepEqual(f.calls[0].body, { actor_user_id: 'current-actor', operation_id: id });
});
test('absence is explicit and malformed results never become absence', async () => {
  const absent = await routeSeasonCreationOperation(request(), env, fixture(null));
  assert.deepEqual(await absent.json(), { operationId: id, found: false });
  for (const value of [{}, [], { setup: { id: 'season' } }, { setup: null, requestedInput: {} }]) {
    const response = await routeSeasonCreationOperation(request(), env, fixture(value));
    assert.equal(response.status, 502);
    assert.equal(Object.hasOwn(await response.json(), 'found'), false);
  }
});
test('signed-out, invalid identities, methods and other lanes cannot reach the read RPC', async () => {
  const f = fixture(null);
  assert.equal((await routeSeasonCreationOperation(request(id, 'GET', ''), env, f)).status, 401);
  for (const value of ['bad', '00000000-0000-0000-0000-000000000000']) {
    assert.equal((await routeSeasonCreationOperation(request(value), env, f)).status, 400);
  }
  assert.equal((await routeSeasonCreationOperation(request(id, 'POST'), env, f)).status, 405);
  for (const lane of ['dru', 'gamma', 'production']) {
    assert.equal((await routeSeasonCreationOperation(request(), { ...env, ENVIRONMENT: lane }, f)).status, 404);
  }
  assert.equal(f.calls.length, 0);
});
test('denied or failed read never invokes a creator or retries', async () => {
  for (const status of [403, 429]) {
    const f = fixture({ message: 'Request denied' }, status);
    const response = await routeSeasonCreationOperation(request(), env, f);
    assert.equal(response.status, status);
    assert.equal(f.calls.length, 1);
    assert.match(f.calls[0].url, /\/read_season_creation_operation$/);
  }
});
test('429 preserves only validated bounded guidance and never exposes backend payloads', async () => {
  for (const [value, expected] of [['10', '10'], ['invalid', null], ['9999999', null], ['-1', null]]) {
    const f = fixture({ message: '<html>private backend payload</html>' }, 429, value);
    const response = await routeSeasonCreationOperation(request(), env, f);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), expected);
    assert.doesNotMatch(JSON.stringify(await response.json()), /private backend|html/);
    assert.equal(f.calls.length, 1);
  }
});
