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
import {
  JFL_SIMULATED_OIDC_ACCESS_TOKEN,
  authenticateSupabaseUser,
  resolveBetaBypassActor,
} from '../src/supabaseAuth.js';

const jflOperatorId = 'b22805b6-92ba-44bd-a92e-0c82f0be6613';
const gammaOperator = { id: '11111111-1111-4111-8111-111111111111', email: 'tester@example.test' };

function env(environment, extra = {}) {
  return {
    ENVIRONMENT: environment,
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
    BETA_AUTH_BYPASS: environment === 'jfl' ? '1' : '0',
    BETA_ACTOR_USER_ID: jflOperatorId,
    BETA_ACTOR_EMAIL: 'jfl-actor@fremontderby.com',
    TEST_PERSONA_OPERATOR_USER_IDS: environment === 'jfl' ? jflOperatorId : gammaOperator.id,
    ...extra,
  };
}

function authFetch(user = gammaOperator) {
  return async () => new Response(JSON.stringify(user), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function requestWithToken(path = '/api/test-persona', options = {}, token = JFL_SIMULATED_OIDC_ACCESS_TOKEN) {
  return new Request(`https://jfl.fremontderby.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

test('persona capability is enabled only for JFL and Gamma', () => {
  assert.equal(testPersonaEnabled(env('jfl')), true);
  assert.equal(testPersonaEnabled(env('gamma')), true);
  assert.equal(testPersonaEnabled(env('production')), false);
  assert.equal(testPersonaEnabled(env('dru')), false);
  assert.equal(testPersonaEnabled(env('staging')), false);
  assert.equal(testPersonaEnabled({}), false);
});

test('canonical persona matrix is exactly the five requested roles', () => {
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

test('JFL and Gamma use different actor ids for every persona', () => {
  for (const { key } of TEST_PERSONAS) {
    assert.match(personaActorId('jfl', key), /^[0-9a-f-]{36}$/);
    assert.match(personaActorId('gamma', key), /^[0-9a-f-]{36}$/);
    assert.notEqual(personaActorId('jfl', key), personaActorId('gamma', key));
  }
});

test('persona cookie is secure, environment-bound, and ignored in production', () => {
  const cookie = testPersonaCookieHeader('regular-captain', env('jfl'));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  const request = new Request('https://jfl.fremontderby.com/profile', { headers: { cookie } });
  assert.equal(selectedTestPersonaKey(request, env('jfl')), 'regular-captain');
  assert.equal(selectedTestPersonaKey(request, env('gamma')), null);
  assert.equal(selectedTestPersonaKey(request, env('production')), null);
});

test('tokenless beta actor cannot operate persona switching', () => {
  const actor = resolveBetaBypassActor(env('jfl'));
  assert.equal(actor.betaBypass, true);
  assert.equal(isTestPersonaOperator(actor, env('jfl')), false);
});

test('JFL simulated OIDC browser actor is an approved operator', async () => {
  const request = requestWithToken('/api/me/profile');
  const actor = await authenticateSupabaseUser(request, env('jfl'));
  assert.equal(actor.id, jflOperatorId);
  assert.equal(actor.simulatedOidc, true);
  assert.equal(isTestPersonaOperator(actor, env('jfl')), true);
});

test('missing operator allowlist fails closed', async () => {
  const disabled = env('jfl', { TEST_PERSONA_OPERATOR_USER_IDS: '' });
  const response = await routeTestPersona(requestWithToken(), disabled);
  assert.equal(response.status, 403);
});

test('production persona route returns 404 before authentication', async () => {
  let authCalled = false;
  const response = await routeTestPersona(
    requestWithToken(),
    env('production'),
    { fetch: async () => { authCalled = true; throw new Error('must not authenticate'); } },
  );
  assert.equal(response.status, 404);
  assert.equal(authCalled, false);
});

test('anonymous JFL caller cannot use persona route even with beta bypass', async () => {
  const request = new Request('https://jfl.fremontderby.com/api/test-persona');
  const response = await routeTestPersona(request, env('jfl'));
  assert.equal(response.status, 401);
});

test('simulated JFL operator can list and select only canonical personas', async () => {
  const getResponse = await routeTestPersona(requestWithToken(), env('jfl'));
  assert.equal(getResponse.status, 200);
  const state = await getResponse.json();
  assert.equal(state.personas.length, 5);
  assert.equal(state.current, null);

  const badResponse = await routeTestPersona(
    requestWithToken('/api/test-persona', {
      method: 'POST',
      body: JSON.stringify({ persona: 'site-owner-superuser' }),
    }),
    env('jfl'),
  );
  assert.equal(badResponse.status, 400);

  const setResponse = await routeTestPersona(
    requestWithToken('/api/test-persona', {
      method: 'POST',
      body: JSON.stringify({ persona: 'player-a' }),
    }),
    env('jfl'),
  );
  assert.equal(setResponse.status, 200);
  assert.match(setResponse.headers.get('set-cookie') || '', /^fd_test_persona=/);
  assert.doesNotMatch(setResponse.headers.get('set-cookie') || '', /b22805b6/);
});

test('JFL authenticated API requests assume selected canonical actor', async () => {
  const cookie = testPersonaCookieHeader('player-b', env('jfl'));
  const request = requestWithToken('/api/me/profile', { headers: { cookie } });
  const actor = await authenticateSupabaseUser(request, env('jfl'));
  assert.equal(actor.id, personaActorId('jfl', 'player-b'));
  assert.equal(actor.testPersona.key, 'player-b');
  assert.equal(actor.operatorUserId, jflOperatorId);
});

test('Gamma real bearer user can assume Gamma fixture but production cannot', async () => {
  const gammaEnv = env('gamma');
  const cookie = testPersonaCookieHeader('player-a', gammaEnv);
  const gammaRequest = requestWithToken('/api/me/profile', { headers: { cookie } }, 'real-gamma-token');
  const gammaActor = await authenticateSupabaseUser(gammaRequest, gammaEnv, { fetch: authFetch() });
  assert.equal(gammaActor.id, personaActorId('gamma', 'player-a'));
  assert.equal(gammaActor.testPersona.key, 'player-a');

  const prodActor = await authenticateSupabaseUser(gammaRequest, env('production'), { fetch: authFetch() });
  assert.equal(prodActor.id, gammaOperator.id);
  assert.equal(prodActor.testPersona, undefined);
});

test('forged unknown cookie cannot create an assumed actor', () => {
  const request = new Request('https://jfl.fremontderby.com/profile', {
    headers: { cookie: 'fd_test_persona=jfl%3Asite-owner-superuser' },
  });
  const operator = {
    id: jflOperatorId,
    betaBypass: true,
    simulatedOidc: true,
  };
  assert.equal(resolveTestPersonaActor(request, env('jfl'), operator), null);
});
