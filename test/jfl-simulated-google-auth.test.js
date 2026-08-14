import assert from 'node:assert/strict';
import test from 'node:test';
import { injectJflSimulatedGoogleAuth } from '../src/jflSimulatedGoogleAuth.js';
import {
  AuthError,
  JFL_SIMULATED_OIDC_ACCESS_TOKEN,
  authenticateSupabaseUser,
  jflSimulatedOidcEnabled,
} from '../src/supabaseAuth.js';

function env(environment = 'jfl', overrides = {}) {
  return {
    ENVIRONMENT: environment,
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
    BETA_ACTOR_EMAIL: 'jfl-actor@localhost',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    ...overrides,
  };
}

function requestWithToken(token = JFL_SIMULATED_OIDC_ACCESS_TOKEN) {
  return new Request('https://jfl.example/api/me/profile', {
    headers: { authorization: `Bearer ${token}` },
  });
}

test('simulated Google/OIDC token is enabled only for JFL with explicit bypass', () => {
  assert.equal(jflSimulatedOidcEnabled(env('jfl')), true);
  assert.equal(jflSimulatedOidcEnabled(env('jfl', { BETA_AUTH_BYPASS: '0' })), false);
  for (const environment of ['dru', 'gamma', 'staging', 'production']) {
    assert.equal(jflSimulatedOidcEnabled(env(environment)), false);
  }
});

test('JFL simulated Google/OIDC token resolves to the configured test actor without Supabase', async () => {
  let called = false;
  const actor = await authenticateSupabaseUser(
    requestWithToken(),
    env('jfl'),
    { fetch: async () => { called = true; throw new Error('must not call Supabase'); } },
  );

  assert.equal(called, false);
  assert.equal(actor.id, '00000000-0000-4000-8000-000000000001');
  assert.equal(actor.email, 'jfl-actor@localhost');
  assert.equal(actor.betaBypass, true);
  assert.equal(actor.simulatedOidc, true);
});

test('DRU, Gamma, staging, and production reject the JFL simulated token even with bypass flag present', async () => {
  for (const environment of ['dru', 'gamma', 'staging', 'production']) {
    let called = false;
    await assert.rejects(
      () => authenticateSupabaseUser(
        requestWithToken(),
        env(environment),
        { fetch: async () => { called = true; return new Response('{}', { status: 401 }); } },
      ),
      (error) => error instanceof AuthError
        && error.status === 401
        && error.message === 'Invalid bearer token',
    );
    assert.equal(called, false, `${environment} must reject before contacting Supabase`);
  }
});

test('ordinary bearer tokens still use normal Supabase validation in JFL', async () => {
  let called = 0;
  const actor = await authenticateSupabaseUser(
    requestWithToken('real-google-token'),
    env('jfl'),
    {
      fetch: async (url, options) => {
        called += 1;
        assert.equal(url, 'https://example.supabase.co/auth/v1/user');
        assert.equal(options.headers.authorization, 'Bearer real-google-token');
        return Response.json({ id: 'real-user', email: 'real@example.com' });
      },
    },
  );

  assert.equal(called, 1);
  assert.deepEqual(actor, { id: 'real-user', email: 'real@example.com' });
});

test('JFL profile response receives simulated login shim', async () => {
  const input = new Response('<!doctype html><html><head></head><body><button data-google-sign-in>Continue with Google</button></body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const output = await injectJflSimulatedGoogleAuth(input, env('jfl'));
  const html = await output.text();

  assert.match(html, /data-fd-jfl-simulated-auth/);
  assert.match(html, /fd-jfl-simulated-google-oidc-v1/);
  assert.match(html, /data-google-sign-in/);
  assert.match(html, /data-logout/);
  assert.match(html, /simulates OIDC and signs in as the JFL admin test actor/);
});

test('simulated login shim is absent outside JFL even if bypass flag leaks', async () => {
  for (const environment of ['dru', 'gamma', 'staging', 'production']) {
    const html = '<!doctype html><html><head></head><body>Profile</body></html>';
    const output = await injectJflSimulatedGoogleAuth(
      new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
      env(environment),
    );
    assert.equal(await output.text(), html);
  }
});
