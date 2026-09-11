import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  TEST_PERSONAS,
  personaActorId,
  selectedTestPersonaKey,
  testPersonaCookieHeader,
  testPersonaEnabled,
} from '../src/testPersona.js';
import { routeTestPersona } from '../src/testPersonaHttp.js';
import { authenticateSupabaseUser } from '../src/supabaseAuth.js';

const gammaOperatorId = 'e0b7c076-106b-4160-bfab-6de69a4f5ded';
const gammaUser = { id: gammaOperatorId, email: 'gamma-tester@example.test' };

function env(environment, extra = {}) {
  return {
    ENVIRONMENT: environment,
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
    TEST_PERSONA_OPERATOR_USER_IDS: environment === 'gamma' ? gammaOperatorId : '',
    ...extra,
  };
}

function authFetch(user = gammaUser) {
  return async () => new Response(JSON.stringify(user), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function request(path = '/api/test-persona', options = {}, token = 'real-gamma-token') {
  return new Request(`https://gamma.fremontderby.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

test('Gamma exposes exactly the five canonical personas to the approved real-auth operator', async () => {
  const response = await routeTestPersona(request(), env('gamma'), { fetch: authFetch() });
  assert.equal(response.status, 200);
  const state = await response.json();
  assert.equal(state.environment, 'gamma');
  assert.deepEqual(
    state.personas.map(({ key, label }) => [key, label]),
    TEST_PERSONAS.map(({ key, label }) => [key, label]),
  );
});

test('Gamma rejects missing operator allowlist and arbitrary persona keys', async () => {
  const noAllowlist = await routeTestPersona(
    request(),
    env('gamma', { TEST_PERSONA_OPERATOR_USER_IDS: '' }),
    { fetch: authFetch() },
  );
  assert.equal(noAllowlist.status, 403);

  const arbitrary = await routeTestPersona(
    request('/api/test-persona', {
      method: 'POST',
      body: JSON.stringify({ persona: 'site-owner-superuser' }),
    }),
    env('gamma'),
    { fetch: authFetch() },
  );
  assert.equal(arbitrary.status, 400);
});

test('Gamma POST sets an environment-bound secure persona cookie and server auth assumes that actor', async () => {
  const setResponse = await routeTestPersona(
    request('/api/test-persona', {
      method: 'POST',
      body: JSON.stringify({ persona: 'player-a' }),
    }),
    env('gamma'),
    { fetch: authFetch() },
  );
  assert.equal(setResponse.status, 200);
  const setCookie = setResponse.headers.get('set-cookie') || '';
  assert.match(setCookie, /^fd_test_persona=/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Strict/);

  const cookie = testPersonaCookieHeader('player-a', env('gamma'));
  const actorRequest = request('/api/me/profile', { headers: { cookie } });
  const actor = await authenticateSupabaseUser(actorRequest, env('gamma'), { fetch: authFetch() });
  assert.equal(actor.id, personaActorId('gamma', 'player-a'));
  assert.equal(actor.testPersona.key, 'player-a');
  assert.equal(actor.operatorUserId, gammaOperatorId);
});

test('JFL persona cookies cannot bleed into Gamma', () => {
  const jflCookie = testPersonaCookieHeader('regular-captain', {
    ENVIRONMENT: 'jfl',
    TEST_PERSONA_OPERATOR_USER_IDS: 'irrelevant',
  });
  const gammaRequest = new Request('https://gamma.fremontderby.com/profile', {
    headers: { cookie: jflCookie },
  });
  assert.equal(selectedTestPersonaKey(gammaRequest, env('gamma')), null);
});

test('production fails closed despite spoofed hostname, query, headers, payload, and persona cookie', async () => {
  let authCalled = false;
  const productionCookie = 'fd_test_persona=production%3Aadmin-captain';
  const attack = new Request('https://jfl.fremontderby.com/api/test-persona?environment=gamma', {
    method: 'POST',
    headers: {
      authorization: 'Bearer forged-token',
      cookie: productionCookie,
      'x-environment': 'gamma',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ persona: 'admin-captain' }),
  });
  const response = await routeTestPersona(attack, env('production'), {
    fetch: async () => { authCalled = true; throw new Error('production must fail before auth'); },
  });
  assert.equal(response.status, 404);
  assert.equal(authCalled, false);
  assert.equal(testPersonaEnabled(env('production')), false);
});

test('production auth ignores a Gamma persona cookie and remains the real authenticated user', async () => {
  const gammaCookie = testPersonaCookieHeader('admin-captain', env('gamma'));
  const prodRequest = new Request('https://fremontderby.com/api/me/profile', {
    headers: {
      authorization: 'Bearer real-production-token',
      cookie: gammaCookie,
    },
  });
  const realProductionUser = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'prod@example.test' };
  const actor = await authenticateSupabaseUser(prodRequest, env('production'), {
    fetch: authFetch(realProductionUser),
  });
  assert.equal(actor.id, realProductionUser.id);
  assert.equal(actor.testPersona, undefined);
});

test('Wrangler keeps production on canonical router and enables persona wrapper only for Gamma', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.main, 'src/routerEntry.js');
  assert.equal(config.vars.ENVIRONMENT, 'production');
  assert.equal(config.vars.TEST_PERSONA_OPERATOR_USER_IDS, undefined);
  assert.equal(config.env.gamma.main, 'src/personaRouterEntry.js');
  assert.equal(config.env.gamma.vars.ENVIRONMENT, 'gamma');
  assert.equal(config.env.dru.main, undefined);
  assert.equal(config.env.staging.main, undefined);
});
