import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authenticateSupabaseUser,
  betaAuthBypassEnabled,
  resolveBetaBypassActor,
} from '../src/supabaseAuth.js';
import { environmentReadiness } from '../src/environmentReadiness.js';

test('beta auth bypass only when ENVIRONMENT is beta and flag is 1', () => {
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta', BETA_AUTH_BYPASS: '1' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'production', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'staging', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'beta', BETA_AUTH_BYPASS: '0' }), false);
});

test('authenticateSupabaseUser returns beta actor without bearer on beta', async () => {
  const actor = await authenticateSupabaseUser(
    new Request('https://beta.example/api/test'),
    {
      ENVIRONMENT: 'beta',
      BETA_AUTH_BYPASS: '1',
      BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
      BETA_ACTOR_EMAIL: 'beta@localhost',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'pub',
    },
  );
  assert.equal(actor.id, '00000000-0000-4000-8000-000000000001');
  assert.equal(actor.betaBypass, true);
});

test('authenticateSupabaseUser still requires bearer on production', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://fremontderby.com/api/test'),
      {
        ENVIRONMENT: 'production',
        BETA_AUTH_BYPASS: '1',
        BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
        SUPABASE_URL: 'https://example.supabase.co',
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

test('environment readiness treats beta as a known environment', () => {
  const report = environmentReadiness({
    ENVIRONMENT: 'beta',
    SUPABASE_URL: 'https://mybeta.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
  });
  assert.equal(report.environment, 'beta');
  const known = report.checks.find((c) => c.name === 'knownWorkerEnvironment');
  assert.equal(known.ok, true);
});
