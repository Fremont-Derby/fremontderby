import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authenticateSupabaseUser,
  betaAuthBypassEnabled,
  resolveBetaBypassActor,
} from '../src/supabaseAuth.js';
import { environmentReadiness } from '../src/environmentReadiness.js';

const productionProjectRef = 'cpiucsxlkicmlbvdvhww';
const stagingProjectRef = 'oqkkvqkerusepyokzbmt';
const betaProjectRef = 'betabetabetabetabeta';

function betaEnv(overrides = {}) {
  return {
    ENVIRONMENT: 'beta',
    SUPABASE_URL: `https://${betaProjectRef}.supabase.co`,
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    BETA_EXPECTED_SUPABASE_PROJECT_REF: betaProjectRef,
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
    BETA_ACTOR_EMAIL: 'beta@localhost',
    ...overrides,
  };
}

test('beta auth bypass only when ENVIRONMENT is beta and flag is 1', () => {
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta', BETA_AUTH_BYPASS: '1' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'production', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'staging', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta', BETA_AUTH_BYPASS: '0' }), false);
});

test('authenticateSupabaseUser returns beta actor only when bearer is absent', async () => {
  const actor = await authenticateSupabaseUser(
    new Request('https://beta.example/api/test'),
    betaEnv(),
  );
  assert.equal(actor.id, '00000000-0000-4000-8000-000000000001');
  assert.equal(actor.betaBypass, true);
});

test('authenticateSupabaseUser rejects an invalid supplied bearer on beta', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://beta.example/api/test', {
        headers: { authorization: 'Bearer invalid-token' },
      }),
      betaEnv(),
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

test('authenticateSupabaseUser still requires bearer on production', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://fremontderby.com/api/test'),
      {
        ENVIRONMENT: 'production',
        BETA_AUTH_BYPASS: '1',
        BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
        SUPABASE_URL: `https://${productionProjectRef}.supabase.co`,
        SUPABASE_PUBLISHABLE_KEY: 'pub',
      },
    ),
    (error) => error.name === 'AuthError' && /Missing bearer token/.test(error.message),
  );
});

test('resolveBetaBypassActor fails closed without actor id', () => {
  assert.throws(
    () => resolveBetaBypassActor({ ENVIRONMENT: 'beta', BETA_AUTH_BYPASS: '1' }),
    (error) => error.name === 'AuthError',
  );
});

test('environment readiness accepts only an explicitly configured isolated beta project', () => {
  const report = environmentReadiness(betaEnv());
  assert.equal(report.environment, 'beta');
  assert.equal(report.ok, true);
  assert.equal(report.checks.find((c) => c.name === 'knownWorkerEnvironment')?.ok, true);
  assert.equal(report.checks.find((c) => c.name === 'betaExpectedProjectRefConfigured')?.ok, true);
  assert.equal(report.checks.find((c) => c.name === 'betaExpectedProjectRefIsolated')?.ok, true);
  assert.equal(report.checks.find((c) => c.name === 'betaActualProjectIsolated')?.ok, true);
  assert.equal(report.checks.find((c) => c.name === 'supabaseProjectMatchesEnvironment')?.ok, true);
});

test('environment readiness fails closed when beta expected project ref is missing', () => {
  const report = environmentReadiness(betaEnv({ BETA_EXPECTED_SUPABASE_PROJECT_REF: '' }));
  assert.equal(report.ok, false);
  assert.equal(report.checks.find((c) => c.name === 'betaExpectedProjectRefConfigured')?.ok, false);
  assert.equal(report.checks.find((c) => c.name === 'supabaseProjectMatchesEnvironment')?.ok, false);
});

test('environment readiness rejects production or staging projects for beta', () => {
  for (const projectRef of [productionProjectRef, stagingProjectRef]) {
    const report = environmentReadiness(betaEnv({
      SUPABASE_URL: `https://${projectRef}.supabase.co`,
      BETA_EXPECTED_SUPABASE_PROJECT_REF: projectRef,
    }));
    assert.equal(report.ok, false);
    assert.equal(report.checks.find((c) => c.name === 'betaExpectedProjectRefIsolated')?.ok, false);
    assert.equal(report.checks.find((c) => c.name === 'betaActualProjectIsolated')?.ok, false);
    assert.equal(report.checks.find((c) => c.name === 'supabaseProjectMatchesEnvironment')?.ok, false);
  }
});

test('environment readiness rejects a mismatched beta project ref', () => {
  const report = environmentReadiness(betaEnv({
    BETA_EXPECTED_SUPABASE_PROJECT_REF: 'differentbetaproject',
  }));
  assert.equal(report.ok, false);
  assert.equal(report.checks.find((c) => c.name === 'supabaseProjectMatchesEnvironment')?.ok, false);
});
