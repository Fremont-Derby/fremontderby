import test from 'node:test';
import assert from 'node:assert/strict';
import { environmentReadiness, supabaseProjectRefFromUrl } from '../src/environmentReadiness.js';

const productionProjectRef = 'cpiucsxlkicmlbvdvhww';
const stagingProjectRef = 'oqkkvqkerusepyokzbmt';

function laneEnv(environment, overrides = {}) {
  return {
    ENVIRONMENT: environment,
    SUPABASE_URL: `https://${stagingProjectRef}.supabase.co`,
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    EXPECTED_SUPABASE_PROJECT_REF: stagingProjectRef,
    SUPABASE_SCHEMA: environment,
    ...(['jfl', 'dru'].includes(environment)
      ? { BETA_AUTH_BYPASS: '1', BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001' }
      : {}),
    ...overrides,
  };
}

test('Supabase project refs are extracted only from Supabase project URLs', () => {
  assert.equal(supabaseProjectRefFromUrl('https://cpiucsxlkicmlbvdvhww.supabase.co/'), productionProjectRef);
  assert.equal(supabaseProjectRefFromUrl('https://example.com'), null);
  assert.equal(supabaseProjectRefFromUrl('not a url'), null);
});

test('production readiness preserves the production project and public schema', () => {
  const readiness = environmentReadiness({
    ENVIRONMENT: 'production',
    SUPABASE_URL: `https://${productionProjectRef}.supabase.co`,
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  });
  assert.equal(readiness.ok, true);
  assert.equal(readiness.expectedSupabaseProjectRef, productionProjectRef);
  assert.equal(readiness.expectedSupabaseSchema, 'public');
  assert.equal(readiness.supabase.schema, 'public');
});

test('staging readiness fails if it points at production', () => {
  const readiness = environmentReadiness({
    ENVIRONMENT: 'staging',
    SUPABASE_URL: `https://${productionProjectRef}.supabase.co`,
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  });
  assert.equal(readiness.ok, false);
  assert.equal(readiness.checks.find((c) => c.name === 'supabaseProjectMatchesEnvironment')?.ok, false);
});

for (const environment of ['jfl', 'dru', 'gamma']) {
  test(`${environment} accepts the shared staging project only with its own schema`, () => {
    const readiness = environmentReadiness(laneEnv(environment));
    assert.equal(readiness.ok, true);
    assert.equal(readiness.expectedSupabaseProjectRef, stagingProjectRef);
    assert.equal(readiness.expectedSupabaseSchema, environment);
  });

  test(`${environment} fails closed on another lane schema`, () => {
    const readiness = environmentReadiness(laneEnv(environment, { SUPABASE_SCHEMA: environment === 'jfl' ? 'dru' : 'jfl' }));
    assert.equal(readiness.ok, false);
    assert.equal(readiness.checks.find((c) => c.name === 'supabaseSchemaMatchesEnvironment')?.ok, false);
  });

  test(`${environment} fails closed on production data`, () => {
    const readiness = environmentReadiness(laneEnv(environment, {
      SUPABASE_URL: `https://${productionProjectRef}.supabase.co`,
    }));
    assert.equal(readiness.ok, false);
    assert.equal(readiness.checks.find((c) => c.name === 'actualProjectIsolated')?.ok, false);
  });
}

test('gamma forbids test auth bypass (RC lane)', () => {
  const readiness = environmentReadiness(laneEnv('gamma', { BETA_AUTH_BYPASS: '1' }));
  assert.equal(readiness.checks.find((c) => c.name === 'authBypassRestrictedToTestLane')?.ok, false);
  assert.equal(readiness.ok, false);
  // Without an explicit bypass flag, gamma readiness can still be green on project/schema alone.
  const clean = environmentReadiness(laneEnv('gamma'));
  assert.equal(clean.ok, true);
  assert.equal(clean.checks.find((c) => c.name === 'testAuthBypassFlag'), undefined);
});

test('jfl/dru still require test auth bypass flag when on test-auth runtime', () => {
  for (const environment of ['jfl', 'dru']) {
    const readiness = environmentReadiness(laneEnv(environment));
    assert.equal(readiness.checks.find((c) => c.name === 'authBypassRestrictedToTestLane')?.ok, true);
    assert.equal(readiness.checks.find((c) => c.name === 'testAuthBypassFlag')?.ok, true);
  }
});

test('readiness never exposes secret values', () => {
  const readiness = environmentReadiness({
    ENVIRONMENT: 'production',
    SUPABASE_URL: '',
    SUPABASE_PUBLISHABLE_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-secret',
  });
  assert.equal(readiness.ok, false);
  assert.doesNotMatch(JSON.stringify(readiness), /server-only-secret/);
});

test('lane readiness reports private PostgREST profile name', () => {
  const result = environmentReadiness({
    ENVIRONMENT: 'dru',
    SUPABASE_URL: 'https://oqkkvqkerusepyokzbmt.supabase.co',
    SUPABASE_SCHEMA: 'dru',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    SUPABASE_SERVICE_ROLE_KEY: 'role',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
  });
  assert.equal(result.expectedSupabaseSchema, 'dru');
  assert.equal(result.expectedPrivateSupabaseSchema, 'dru_private');
});
