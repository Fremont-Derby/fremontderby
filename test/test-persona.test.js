import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEST_PERSONAS,
  isTestPersonaOperator,
  personaActorId,
  resolveTestPersonaActor,
  selectedTestPersonaKey,
  testPersonaCookieHeader,
  testPersonaEnabled,
} from '../src/testPersona.js';
import { routeTestPersona } from '../src/testPersonaHttp.js';
import { authenticateSupabaseUser } from '../src/supabaseAuth.js';

const operator = { id: '11111111-1111-4111-8111-111111111111', email: 'tester@example.test' };

function env(environment, extra = {}) {
  return {
    ENVIRONMENT: environment,
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
    BETA_AUTH_BYPASS: '0',
    ...extra,
  };
}

function authFetch(user = operator) {
  return async () => new Response(JSON.stringify(user), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function bearerRequest(path = '/api/test-persona', options = {}) {
  return new Request(`https://jfl.fremontderby.com${path}`, {
    ...options,
    headers: {
      authorization: 'Bearer signed-test-token',
      ...(options.headers || {}),
    },
  });
}

test('persona capability is enabled only for jfl and gamma', () => {
  assert.equal(testPersonaEnabled(env('jfl')), true);
  assert.equal(testPersonaEnabled(env('gamma')), true);
  assert.equal(testPersonaEnabled(env('production')), false);
  assert.equal(testPersonaEnabled(env('dru')), false);
  assert.equal(testPersonaEnabled(env('')), false);
  assert.equal(testPersonaEnabled({}), false);
});

test('canonical persona matrix has exactly the five requested roles', () => {
  assert.deepEqual(
    TEST_PERSONAS.map(({ key, label }) => [key, label]),
    [
      ['admin-no-team', 'Admin — no team'],
      ['admin-captain', 'Admin Captain'],
      ['regular-captain', 'Regular Captain'],
      ['player-a', 'Player A'],
      ['player-b', 'Player B'],
    ],
  );
});

test('JFL and Gamma map the same persona key to different fixture actors', () => {
  for (const { key } of TEST_PERSONAS) {
    assert.match(personaActorId('jfl', key), /^[0-9a-f-]{36}$/);
    assert.match(personaActorId('gamma', key), /^[0-9a-f-]{36}$/);
    assert.notEqual(personaActorId('jfl', key), personaActorId('gamma', key));
  }
});

test('persona cookie is environment-bound and ignored in production', () => {
  const cookie = testPersonaCookieHeader('regular-captain', env('jfl'));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  const request = new Request('https://jfl.fremontderby.com/profile', { headers: { cookie } });
  assert.equal(selectedTestPersonaKey(request, env('jfl')), 'regular-captain');
  assert.equal(selectedTestPersonaKey(request, env('gamma')), null);
  assert.equal(selectedTestPersonaKey(request, env('production')), null);
});

test('open-auth beta bypass actor cannot operate persona switching', () => {
  assert.equal(isTestPersonaOperator({ ...operator, betaBypass: true }, env('jfl')), false);
});

test('configured operator allowlist narrows access', () => {
  const restricted = env('jfl', { TEST_PERSONA_OPERATOR_USER_IDS: operator.id });
  assert.equal(isTestPersonaOperator(operator, restricted), true);
  assert.equal(isTestPersonaOperator({ id: '22222222-2222-4222-8222-222222222222' }, restricted), false);
});

test('production persona route returns 404 before attempting authentication', async () => {
  let authCalled = false;
  const response = await routeTestPersona(
    bearerRequest(),
    env('production'),
    { fetch: async () => { authCalled = true; throw new Error('must not authenticate'); } },
  );
  assert.equal(response.status, 404);
  assert.equal(authCalled, false);
});

test('anonymous JFL caller cannot use persona route even when beta bypass exists', async () => {
  const request = new Request('https://jfl.fremontderby.com/api/test-persona');
  const response = await routeTestPersona(request, env('jfl', { BETA_AUTH_BYPASS: '1' }), { fetch: authFetch() });
  assert.equal(response.status, 401);
});

test('authenticated JFL operator can list and select only canonical personas', async () => {
  const getResponse = await routeTestPersona(bearerRequest(), env('jfl'), { fetch: authFetch() });
  assert.equal(getResponse.status, 200);
  const state = await getResponse.json();
  assert.equal(state.personas.length, 5);
  assert.equal(state.current, null);

  const badResponse = await routeTestPersona(
    bearerRequest('/api/test-persona', { method: 'POST', body: JSON.stringify({ persona: 'arbitrary-admin' }) }),
    env('jfl'),
    { fetch: authFetch() },
  );
  assert.equal(badResponse.status, 400);

  const setResponse = await routeTestPersona(
    bearerRequest('/api/test-persona', { method: 'POST', body: JSON.stringify({ persona: 'player-a' }) }),
    env('jfl'),
    { fetch: authFetch() },
  );
  assert.equal(setResponse.status, 200);
  assert.match(setResponse.headers.get('set-cookie') || '', /^fd_test_persona=/);
  assert.doesNotMatch(setResponse.headers.get('set-cookie') || '', /11111111-1111/);
});

test('authenticated API requests assume canonical actor only in JFL/Gamma', async () => {
  const cookie = testPersonaCookieHeader('player-b', env('jfl'));
  const request = bearerRequest('/api/me/profile', { headers: { cookie } });
  const actor = await authenticateSupabaseUser(request, env('jfl'), { fetch: authFetch() });
  assert.equal(actor.id, personaActorId('jfl', 'player-b'));
  assert.equal(actor.testPersona.key, 'player-b');
  assert.equal(actor.operatorUserId, operator.id);

  const productionActor = await authenticateSupabaseUser(request, env('production'), { fetch: authFetch() });
  assert.equal(productionActor.id, operator.id);
  assert.equal(productionActor.testPersona, undefined);
});

test('forged unknown cookie cannot create an assumed actor', () => {
  const request = new Request('https://jfl.fremontderby.com/profile', {
    headers: { cookie: 'fd_test_persona=jfl%3Asite-owner-superuser' },
  });
  assert.equal(resolveTestPersonaActor(request, env('jfl'), operator), null);
});
