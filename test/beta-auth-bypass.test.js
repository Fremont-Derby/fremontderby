import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authenticateSupabaseUser,
  betaAuthBypassEnabled,
  resolveBetaBypassActor,
  OPEN_AUTH_ENVIRONMENTS,
} from '../src/supabaseAuth.js';
import { environmentReadiness } from '../src/environmentReadiness.js';

const betaProjectRef = 'isolatedbetaproject';

function betaEnv(overrides = {}) {
  return {
    ENVIRONMENT: 'beta-jfl',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
    BETA_ACTOR_EMAIL: 'beta@localhost',
    BETA_EXPECTED_SUPABASE_PROJECT_REF: betaProjectRef,
    SUPABASE_URL: `https://${betaProjectRef}.supabase.co`,
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    ...overrides,
  };
}

test('open-auth environments include jfl and dru lanes', () => {
  assert.ok(OPEN_AUTH_ENVIRONMENTS.has('beta-jfl'));
  assert.ok(OPEN_AUTH_ENVIRONMENTS.has('beta-dru'));
  assert.ok(OPEN_AUTH_ENVIRONMENTS.has('beta'));
  assert.equal(OPEN_AUTH_ENVIRONMENTS.has('gamma'), false);
  assert.equal(OPEN_AUTH_ENVIRONMENTS.has('production'), false);
});

test('beta auth bypass only on beta lanes with flag', () => {
  assert.equal(betaAuthBypassEnabled(betaEnv()), true);
  assert.equal(betaAuthBypassEnabled(betaEnv({ ENVIRONMENT: 'beta-dru' })), true);
  assert.equal(betaAuthBypassEnabled(betaEnv({ ENVIRONMENT: 'production' })), false);
  assert.equal(betaAuthBypassEnabled(betaEnv({ ENVIRONMENT: 'gamma' })), false);
  assert.equal(betaAuthBypassEnabled(betaEnv({ ENVIRONMENT: 'staging' })), false);
  assert.equal(betaAuthBypassEnabled(betaEnv({ BETA_AUTH_BYPASS: '0' })), false);
});

test('authenticateSupabaseUser returns beta actor without bearer on beta-jfl', async () => {
  const actor = await authenticateSupabaseUser(
    new Request('https://jfl.fremontderby.com/api/test'),
    betaEnv(),
  );
  assert.equal(actor.id, '00000000-0000-4000-8000-000000000001');
  assert.equal(actor.betaBypass, true);
});

test('authenticateSupabaseUser still requires bearer on production', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://fremontderby.com/api/test'),
      betaEnv({ ENVIRONMENT: 'production', BETA_AUTH_BYPASS: '1' }),
    ),
    (error) => error.name === 'AuthError' && /Missing bearer token/.test(error.message),
  );
});

test('invalid bearer on beta does not fall through to bypass', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://jfl.fremontderby.com/api/test', {
        headers: { authorization: 'Bearer not-a-real-token' },
      }),
      betaEnv(),
      {
        fetch: async () => new Response('{}', { status: 401 }),
      },
    ),
    (error) => error.name === 'AuthError' && /Invalid bearer token/.test(error.message),
  );
});

test('resolveBetaBypassActor fails closed without actor id', () => {
  assert.throws(
    () => resolveBetaBypassActor({ ENVIRONMENT: 'beta-jfl', BETA_AUTH_BYPASS: '1' }),
    (error) => error.name === 'AuthError',
  );
});

test('environment readiness treats beta-jfl as a known isolated lane', () => {
  const report = environmentReadiness(betaEnv());
  assert.equal(report.environment, 'beta-jfl');
  assert.equal(report.checks.find((c) => c.name === 'knownWorkerEnvironment')?.ok, true);
  assert.equal(report.checks.find((c) => c.name === 'betaAuthBypassFlag')?.ok, true);
});

test('beta readiness fails when expected project is production', () => {
  const report = environmentReadiness(betaEnv({
    BETA_EXPECTED_SUPABASE_PROJECT_REF: 'cpiucsxlkicmlbvdvhww',
    SUPABASE_URL: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
  }));
  assert.equal(report.ok, false);
  assert.equal(report.checks.find((c) => c.name === 'betaExpectedProjectIsolated')?.ok, false);
});
