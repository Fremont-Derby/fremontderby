import test from 'node:test';
import assert from 'node:assert/strict';
import { listTestPersonas, personaActorId, selectedTestPersonaKey, resolveTestPersonaActor, testPersonaCookieHeader } from '../src/testPersona.js';
import { routeTestPersona } from '../src/testPersonaHttp.js';
import { authenticateSupabaseUser, JFL_SIMULATED_OIDC_ACCESS_TOKEN } from '../src/supabaseAuth.js';

const operatorId = 'b22805b6-92ba-44bd-a92e-0c82f0be6613';
const enabled = { ENVIRONMENT: 'jfl', TEST_FULL_SEASON_PERSONAS_ENABLED: '1', TEST_PERSONA_OPERATOR_USER_IDS: operatorId, BETA_AUTH_BYPASS: '1', BETA_ACTOR_USER_ID: operatorId, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'fixture' };
const operator = { id: operatorId, betaBypass: true, simulatedOidc: true };
const key = i => `full-season-captain-${i}`;
const request = (persona, token = JFL_SIMULATED_OIDC_ACCESS_TOKEN) => new Request('https://jfl.fremontderby.com/api/test-persona', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ persona }) });

test('eight distinct full-season captains extend only explicitly enabled JFL', () => {
  assert.equal(listTestPersonas(enabled).length, 13);
  const ids = new Set();
  for (let i = 1; i <= 8; i++) {
    const cookie = testPersonaCookieHeader(key(i), enabled);
    assert.ok(cookie);
    const req = new Request('https://jfl.fremontderby.com/profile', { headers: { cookie } });
    const actor = resolveTestPersonaActor(req, enabled, operator);
    assert.equal(actor.testPersona.key, key(i));
    assert.equal(actor.email, `${key(i)}@jfl.persona.invalid`);
    assert.equal(actor.operatorUserId, operatorId);
    assert.notEqual(actor.id, personaActorId('jfl', 'admin-captain'));
    ids.add(actor.id);
  }
  assert.equal(ids.size, 8);
});

for (const environment of ['gamma', 'production', 'dru', 'staging', '', 'unknown']) {
  test(`full-season persona rejects listing, selection and forged cookie in ${environment || 'missing environment'}`, async () => {
    const env = { ...enabled, ENVIRONMENT: environment };
    assert.equal(listTestPersonas(env).some(p => p.key === key(1)), false);
    assert.equal(testPersonaCookieHeader(key(1), env), null);
    const req = new Request('https://fixture.test/profile', { headers: { cookie: 'fd_test_persona=' + encodeURIComponent(`${environment}:${key(1)}`) } });
    assert.equal(selectedTestPersonaKey(req, env), null);
    assert.equal(resolveTestPersonaActor(req, env, operator), null);
    assert.equal(personaActorId(environment, key(1)), null);
    const response = await routeTestPersona(request(key(1), 'real-operator-token'), env, { fetch: async () => Response.json({ id: operatorId }) });
    assert.equal(response.status, environment === 'gamma' ? 400 : 404);
    assert.equal(response.headers.has('set-cookie'), false);
  });
}

for (const flag of [undefined, '', '0', 'true', ' 1 ']) test(`full-season feature fails closed for flag ${String(flag)}`, async () => {
  const env = { ...enabled, TEST_FULL_SEASON_PERSONAS_ENABLED: flag };
  assert.equal(listTestPersonas(env).length, 5);
  const req = new Request('https://fixture.test/profile', { headers: { cookie: 'fd_test_persona=jfl%3Afull-season-captain-1' } });
  assert.equal(resolveTestPersonaActor(req, env, operator), null);
  assert.equal((await routeTestPersona(request(key(1)), env)).status, 400);
});

test('HTTP selection and subsequent authentication bind each additional actor to allowlisted operator', async () => {
  for (let i = 1; i <= 8; i++) {
    const response = await routeTestPersona(request(key(i)), enabled);
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
    const actor = await authenticateSupabaseUser(new Request('https://fixture.test/api/me/profile', { headers: { authorization: `Bearer ${JFL_SIMULATED_OIDC_ACCESS_TOKEN}`, cookie } }), enabled);
    assert.equal(actor.id, personaActorId('jfl', key(i)));
    assert.equal(actor.testPersona.key, key(i));
  }
});

test('unknown keys and unauthorized, tokenless, missing-allowlist operators cannot select additional actors', async () => {
  for (const value of [key(0), key(9), key('1/../../admin'), '__proto__']) {
    assert.equal((await routeTestPersona(request(value), enabled)).status, 400);
  }
  for (const user of [{ id: 'unlisted' }, { id: operatorId, betaBypass: true }, null]) {
    const req = new Request('https://fixture.test/profile', { headers: { cookie: 'fd_test_persona=jfl%3Afull-season-captain-1' } });
    assert.equal(resolveTestPersonaActor(req, enabled, user), null);
  }
  assert.equal((await routeTestPersona(new Request('https://fixture.test/api/test-persona'), enabled)).status, 401);
  assert.equal((await routeTestPersona(request(key(1)), { ...enabled, TEST_PERSONA_OPERATOR_USER_IDS: '' })).status, 403);
  const unauthorized = await routeTestPersona(request(key(1), 'real-unlisted-user'), enabled, { fetch: async () => Response.json({ id: 'unlisted' }) });
  assert.equal(unauthorized.status, 403);
});

test('real JFL session retains its own actor when feature is disabled or operator is not allowlisted', async () => {
  const req = new Request('https://fixture.test/profile', { headers: { authorization: 'Bearer real-session', cookie: 'fd_test_persona=jfl%3Afull-season-captain-1' } });
  const fetch = async () => Response.json({ id: 'real-user', email: 'real@example.test' });
  const actor = await authenticateSupabaseUser(req, enabled, { fetch });
  assert.equal(actor.id, 'real-user');
  assert.equal(actor.testPersona, undefined);
});
