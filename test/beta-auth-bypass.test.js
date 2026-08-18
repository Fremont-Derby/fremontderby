import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authenticateSupabaseUser,
  betaAuthBypassEnabled,
  resolveBetaBypassActor,
} from '../src/supabaseAuth.js';

function testLaneEnv(environment = 'jfl', overrides = {}) {
  return {
    ENVIRONMENT: environment,
    SUPABASE_URL: 'https://betabetabetabetabeta.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
    BETA_ACTOR_EMAIL: 'test@localhost',
    ...overrides,
  };
}

test('test auth bypass is limited to JFL and DRU', () => {
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'jfl', BETA_AUTH_BYPASS: '1' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'dru', BETA_AUTH_BYPASS: '1' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'gamma', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'gamma' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'production', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'staging', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'jfl', BETA_AUTH_BYPASS: '0' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'jfl' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'dru', BETA_AUTH_BYPASS: '' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta', BETA_AUTH_BYPASS: '1' }), false);
});

for (const environment of ['jfl', 'dru']) {
  test(`authenticateSupabaseUser returns the shared actor without bearer in ${environment}`, async () => {
    const actor = await authenticateSupabaseUser(
      new Request(`https://${environment}.example/api/test`),
      testLaneEnv(environment),
    );
    assert.equal(actor.id, '00000000-0000-4000-8000-000000000001');
    assert.equal(actor.betaBypass, true);
  });
}

test('authenticateSupabaseUser rejects an invalid supplied bearer on a test lane', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://jfl.example/api/test', {
        headers: { authorization: 'Bearer invalid-token' },
      }),
      testLaneEnv('jfl'),
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

test('production still requires bearer even if a bypass flag is present', async () => {
  for (const environment of ['production']) {
    await assert.rejects(
      () => authenticateSupabaseUser(
        new Request('https://example.test/api/test'),
        {
          ...testLaneEnv('jfl'),
          ENVIRONMENT: environment,
        },
      ),
      (error) => error.name === 'AuthError' && /Missing bearer token/.test(error.message),
    );
  }
});

test('gamma still requires bearer even if a bypass flag is present', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://gamma.example/api/test'),
      testLaneEnv('gamma'),
    ),
    (error) => error.name === 'AuthError' && /Missing bearer token/.test(error.message),
  );
});

test('resolveBetaBypassActor uses lane default actor when secret unset', () => {
  const actor = resolveBetaBypassActor({ ENVIRONMENT: 'jfl', BETA_AUTH_BYPASS: '1' });
  assert.equal(actor.id, 'b22805b6-92ba-44bd-a92e-0c82f0be6613');
  assert.equal(actor.email, 'jfl-actor@fremontderby.com');
  const dru = resolveBetaBypassActor({ ENVIRONMENT: 'dru' });
  assert.equal(dru.id, '05d025ff-1c97-4070-a691-46a896fb9b83');
});

test('resolveBetaBypassActor fails closed without actor id outside known lanes', () => {
  assert.throws(
    () => resolveBetaBypassActor({ ENVIRONMENT: 'staging', BETA_AUTH_BYPASS: '1' }),
    (error) => error.name === 'AuthError',
  );
});

test('missing or blank ENVIRONMENT never enables test auth bypass', () => {
  assert.equal(betaAuthBypassEnabled({ BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: '', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: '   ', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'DRU', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'JFL', BETA_AUTH_BYPASS: '1' }), false);
});

test('authenticateSupabaseUser without bearer rejects on unset ENVIRONMENT', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://example.test/api/test'),
      {
        BETA_AUTH_BYPASS: '1',
        BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
        SUPABASE_URL: 'https://betabetabetabetabeta.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'pub',
      },
    ),
    (error) => error.name === 'AuthError' && /Missing bearer token/.test(error.message),
  );
});
