import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authenticateSupabaseUser,
  betaAuthBypassEnabled,
  resolveBetaBypassActor,
} from '../src/supabaseAuth.js';

function betaEnv(environment = 'beta-jfl', overrides = {}) {
  return {
    ENVIRONMENT: environment,
    SUPABASE_URL: 'https://betabetabetabetabeta.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
    BETA_ACTOR_EMAIL: 'beta@localhost',
    ...overrides,
  };
}

test('beta auth bypass is limited to beta-jfl and beta-dru', () => {
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta-jfl', BETA_AUTH_BYPASS: '1' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta-dru', BETA_AUTH_BYPASS: '1' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'gamma', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'production', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'staging', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta-jfl', BETA_AUTH_BYPASS: '0' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta', BETA_AUTH_BYPASS: '1' }), false);
});

for (const environment of ['beta-jfl', 'beta-dru']) {
  test(`authenticateSupabaseUser returns the shared actor without bearer in ${environment}`, async () => {
    const actor = await authenticateSupabaseUser(
      new Request(`https://${environment}.example/api/test`),
      betaEnv(environment),
    );
    assert.equal(actor.id, '00000000-0000-4000-8000-000000000001');
    assert.equal(actor.betaBypass, true);
  });
}

test('authenticateSupabaseUser rejects an invalid supplied bearer on beta', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://beta-jfl.example/api/test', {
        headers: { authorization: 'Bearer invalid-token' },
      }),
      betaEnv('beta-jfl'),
      {
        fetch: async () => new Response('{"message":"invalid"}', {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      },
    ),
    (error) => error.name === 'AuthError'
      && error.status === 401
      && /Invalid bearer token/.test(error.message),
  );
});

test('gamma and production still require bearer even if a bypass flag is present', async () => {
  for (const environment of ['gamma', 'production']) {
    await assert.rejects(
      () => authenticateSupabaseUser(
        new Request('https://example.test/api/test'),
        {
          ...betaEnv('beta-jfl'),
          ENVIRONMENT: environment,
        },
      ),
      (error) => error.name === 'AuthError' && /Missing bearer token/.test(error.message),
    );
  }
});

test('resolveBetaBypassActor fails closed without actor id', () => {
  assert.throws(
    () => resolveBetaBypassActor({ ENVIRONMENT: 'beta-jfl', BETA_AUTH_BYPASS: '1' }),
    (error) => error.name === 'AuthError',
  );
});
