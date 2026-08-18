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
    assert.equal(actor.email, 'test@localhost');
    assert.equal(actor.betaBypass, true);
  });
}

test('authenticateSupabaseUser rejects an invalid supplied bearer on a test lane', async () => {
  await assert.rejects(
    () =>
      authenticateSupabaseUser(
        new Request('https://jfl.example/api/test', {
          headers: { authorization: 'Bearer bad-token' },
        }),
        testLaneEnv('jfl'),
        {
          fetch: async () => new Response('nope', { status: 401 }),
        },
      ),
    /Invalid bearer token/,
  );
});

test('production still requires bearer even if a bypass flag is present', async () => {
  await assert.rejects(
    () =>
      authenticateSupabaseUser(
        new Request('https://fremontderby.com/api/test'),
        {
          ENVIRONMENT: 'production',
          BETA_AUTH_BYPASS: '1',
          SUPABASE_URL: 'https://prod.supabase.co',
          SUPABASE_PUBLISHABLE_KEY: 'pub',
        },
      ),
    /Missing bearer token/,
  );
});

test('resolveBetaBypassActor uses lane default actor when secret unset', () => {
  const actor = resolveBetaBypassActor({ ENVIRONMENT: 'jfl' });
  assert.equal(actor.id, 'b22805b6-92ba-44bd-a92e-0c82f0be6613');
});

test('resolveBetaBypassActor fails closed without actor id outside known lanes', () => {
  assert.throws(
    () => resolveBetaBypassActor({ ENVIRONMENT: 'staging' }),
    /BETA_ACTOR_USER_ID is not configured/,
  );
});

test('missing or blank ENVIRONMENT never enables test auth bypass', () => {
  assert.equal(betaAuthBypassEnabled({}), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: '' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: '  ' }), false);
});

test('authenticateSupabaseUser without bearer rejects on unset ENVIRONMENT', async () => {
  await assert.rejects(
    () =>
      authenticateSupabaseUser(
        new Request('https://example/api/test'),
        {
          SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_PUBLISHABLE_KEY: 'pub',
        },
      ),
    /Missing bearer token/,
  );
});
