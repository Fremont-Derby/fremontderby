import test from 'node:test';
import assert from 'node:assert/strict';
import { routeJflProvisionalSeed } from '../src/jflProvisionalSeedHttp.js';

const actor = '10000000-0000-4000-8000-000000000001';
const player = '10000000-0000-4000-8000-000000000002';
const env = { ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://synthetic.supabase.test', SUPABASE_SCHEMA: 'jfl',
  SUPABASE_PUBLISHABLE_KEY: 'synthetic-public', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service' };
const url = 'https://jfl.test/api/admin/players/' + player + '/provisional-seed';
function request(body, method = 'POST', auth = true) {
  return new Request(url, { method, headers: auth ? { authorization: 'Bearer synthetic-user' } : {},
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) });
}
function fake(result = { playerId: player, ratingValue: 500, ratingStatus: 'provisional', source: 'admin_provisional', eventId: '10000000-0000-4000-8000-000000000003', effectiveAt: '2026-10-06T05:00:00Z' }, status = 200) {
  const calls = [];
  return { calls, fetch: async (input, init) => {
    calls.push({ input, init });
    if (input.endsWith('/auth/v1/user')) return Response.json({ id: actor });
    return Response.json({ ...result, ...(init.body ? { reason: JSON.parse(init.body).seed_reason } : {}) }, { status });
  } };
}
test('seed API is JFL-only and never accepts open-auth without a bearer', async () => {
  for (const lane of ['dru', 'gamma', 'production']) assert.equal(await routeJflProvisionalSeed(request({}), { ...env, ENVIRONMENT: lane }), null);
  const f = fake();
  const response = await routeJflProvisionalSeed(request({}, 'POST', false), { ...env, BETA_AUTH_BYPASS: 'true' }, f);
  assert.equal(response.status, 401); assert.equal(f.calls.length, 0);
});
test('recording uses validated actor and isolated profile, ignoring client identity/source claims', async () => {
  const f = fake();
  const response = await routeJflProvisionalSeed(request({ ratingValue: 500, reason: '  Synthetic observation  ', actor_user_id: player, sourceKind: 'official_fargo' }), env, f);
  assert.equal(response.status, 200);
  const rpc = f.calls[1];
  assert.match(rpc.input, /record_admin_provisional_seed$/);
  assert.equal(rpc.init.headers['content-profile'], 'jfl');
  assert.deepEqual(JSON.parse(rpc.init.body), { actor_user_id: actor, target_player_id: player, seed_value: 500, seed_reason: 'Synthetic observation' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
for (const ratingValue of [null, '', '500', false, 1.5, -1, 1001]) {
  test(`invalid seed ${JSON.stringify(ratingValue)} never calls the write RPC`, async () => {
    const f = fake(); const response = await routeJflProvisionalSeed(request({ ratingValue, reason: 'Synthetic reason' }), env, f);
    assert.equal(response.status, 400); assert.equal(f.calls.length, 1);
  });
}
for (const reason of [null, '', '   ', 'x'.repeat(501)]) {
  test(`invalid reason length ${reason?.length ?? 'null'} never calls write RPC`, async () => {
    const f = fake(); const response = await routeJflProvisionalSeed(request({ ratingValue: 500, reason }), env, f);
    assert.equal(response.status, 400); assert.equal(f.calls.length, 1);
  });
}
test('read requires server role checks and never exposes database errors', async () => {
  for (const [code, expected] of [['42501', 403], ['P0002', 404], ['23514', 409], ['22023', 400], ['P0001', 503]]) {
    const f = fake({ code, message: 'synthetic-private diagnostic' }, 400);
    const response = await routeJflProvisionalSeed(request(null, 'GET'), env, f);
    assert.equal(response.status, expected); assert.doesNotMatch(await response.text(), /synthetic-private/);
  }
});
test('mismatched successful response cannot confirm a seed', async () => {
  const f = fake({ playerId: actor });
  assert.equal((await routeJflProvisionalSeed(request({ ratingValue: 500, reason: 'Synthetic reason' }), env, f)).status, 502);
});
for (const ratingValue of [0, 1000]) test(`whole-number boundary ${ratingValue} can be explicitly confirmed`, async () => {
  const f = fake({ playerId: player, ratingValue, ratingStatus: 'provisional', source: 'admin_provisional', eventId: '10000000-0000-4000-8000-000000000003', effectiveAt: '2026-10-06T05:00:00Z' });
  assert.equal((await routeJflProvisionalSeed(request({ ratingValue, reason: 'Synthetic boundary observation' }), env, f)).status, 200);
});
test('invalid bearer, malformed JSON and wrong-lane schema fail without writes', async () => {
  const f = fake();
  assert.equal((await routeJflProvisionalSeed(request('{'), env, f)).status, 400);
  assert.equal(f.calls.length, 1);
  const wrong = fake();
  assert.equal((await routeJflProvisionalSeed(request({ ratingValue: 500, reason: 'Synthetic reason' }), { ...env, SUPABASE_SCHEMA: 'dru' }, wrong)).status, 503);
  assert.equal(wrong.calls.length, 1);
  assert.equal((await routeJflProvisionalSeed(request({}), env, { fetch: async () => new Response('', { status: 401 }) })).status, 401);
});
