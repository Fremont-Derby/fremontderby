import test from 'node:test';
import assert from 'node:assert/strict';
import {
  environmentReadiness,
  supabaseProjectRefFromUrl,
} from '../src/environmentReadiness.js';

const productionProjectRef = 'cpiucsxlkicmlbvdvhww';
const stagingProjectRef = 'oqkkvqkerusepyokzbmt';

function isolatedEnv(environment, projectRef, overrides = {}) {
  return {
    ENVIRONMENT: environment,
    SUPABASE_URL: `https://${projectRef}.supabase.co`,
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    EXPECTED_SUPABASE_PROJECT_REF: projectRef,
    ...overrides,
  };
}

test('Supabase project refs are extracted only from Supabase project URLs', () => {
  assert.equal(
    supabaseProjectRefFromUrl('https://cpiucsxlkicmlbvdvhww.supabase.co/'),
    'cpiucsxlkicmlbvdvhww',
  );
  assert.equal(supabaseProjectRefFromUrl('https://example.com'), null);
  assert.equal(supabaseProjectRefFromUrl('not a url'), null);
});

test('production environment readiness passes for the documented production project', () => {
  const readiness = environmentReadiness({
    ENVIRONMENT: 'production',
    SUPABASE_URL: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  });

  assert.equal(readiness.ok, true);
  assert.equal(readiness.environment, 'production');
  assert.equal(readiness.expectedSupabaseProjectRef, productionProjectRef);
  assert.deepEqual(readiness.supabase, {
    url: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
    projectRef: productionProjectRef,
    hasPublishableKey: true,
    hasServiceRoleKey: true,
  });
  assert.equal(readiness.checks.every((check) => check.ok), true);
});

test('staging readiness fails if it points at the production project', () => {
  const readiness = environmentReadiness({
    ENVIRONMENT: 'staging',
    SUPABASE_URL: `https://${productionProjectRef}.supabase.co`,
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  });

  assert.equal(readiness.ok, false);
  assert.equal(readiness.expectedSupabaseProjectRef, stagingProjectRef);
  const matchCheck = readiness.checks.find(
    (check) => check.name === 'supabaseProjectMatchesEnvironment',
  );
  assert.deepEqual(matchCheck, {
    name: 'supabaseProjectMatchesEnvironment',
    ok: false,
    expectedProjectRef: stagingProjectRef,
    projectRef: productionProjectRef,
  });
});

for (const [environment, projectRef] of [
  ['jfl', 'jflprojectref123456789'],
  ['dru', 'druprojectref123456789'],
  ['gamma', 'gammaprojectref123456'],
]) {
  test(`${environment} readiness accepts its explicitly configured isolated project`, () => {
    const overrides = ['jfl', 'dru'].includes(environment)
      ? { BETA_AUTH_BYPASS: '1', BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001' }
      : {};
    const readiness = environmentReadiness(isolatedEnv(environment, projectRef, overrides));
    assert.equal(readiness.ok, true);
    assert.equal(readiness.expectedSupabaseProjectRef, projectRef);
    assert.equal(readiness.checks.find((c) => c.name === 'expectedProjectRefIsolated')?.ok, true);
    assert.equal(readiness.checks.find((c) => c.name === 'actualProjectIsolated')?.ok, true);
  });
}

test('all isolated lanes fail closed when pointed at production or staging', () => {
  for (const environment of ['jfl', 'dru', 'gamma']) {
    for (const projectRef of [productionProjectRef, stagingProjectRef]) {
      const overrides = ['jfl', 'dru'].includes(environment)
        ? { BETA_AUTH_BYPASS: '1', BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001' }
        : {};
      const readiness = environmentReadiness(isolatedEnv(environment, projectRef, overrides));
      assert.equal(readiness.ok, false);
      assert.equal(readiness.checks.find((c) => c.name === 'expectedProjectRefIsolated')?.ok, false);
      assert.equal(readiness.checks.find((c) => c.name === 'actualProjectIsolated')?.ok, false);
    }
  }
});

test('gamma rejects a stray test auth bypass flag', () => {
  const readiness = environmentReadiness(isolatedEnv(
    'gamma',
    'gammaprojectref123456',
    { BETA_AUTH_BYPASS: '1' },
  ));
  assert.equal(readiness.ok, false);
  assert.equal(readiness.checks.find((c) => c.name === 'authBypassRestrictedToTestLane')?.ok, false);
});

test('readiness reports missing production bindings without exposing secret values', () => {
  const readiness = environmentReadiness({
    ENVIRONMENT: 'production',
    SUPABASE_URL: '',
    SUPABASE_PUBLISHABLE_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-secret',
  });
  const serialized = JSON.stringify(readiness);

  assert.equal(readiness.ok, false);
  assert.equal(readiness.supabase.url, null);
  assert.equal(readiness.supabase.hasPublishableKey, false);
  assert.equal(readiness.supabase.hasServiceRoleKey, true);
  assert.doesNotMatch(serialized, /server-only-secret/);
});

test('missing ENVIRONMENT defaults readiness identity to production', () => {
  const readiness = environmentReadiness({
    SUPABASE_URL: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  });
  assert.equal(readiness.environment, 'production');
});

test('blank ENVIRONMENT string still defaults to production', () => {
  const readiness = environmentReadiness({
    ENVIRONMENT: '   ',
    SUPABASE_URL: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  });
  assert.equal(readiness.environment, 'production');
});

test('dru readiness requires bypass flag and actor when configured as test lane', () => {
  const base = isolatedEnv('dru', 'druprojectref12345678901');
  delete base.BETA_AUTH_BYPASS;
  delete base.BETA_ACTOR_USER_ID;
  const without = environmentReadiness(base);
  assert.equal(without.ok, false);
  assert.equal(without.checks.find((c) => c.name === 'testAuthBypassFlag')?.ok, false);

  const withBypass = environmentReadiness({
    ...base,
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000099',
  });
  assert.equal(withBypass.checks.find((c) => c.name === 'testAuthBypassFlag')?.ok, true);
  assert.equal(withBypass.checks.find((c) => c.name === 'testActorUserIdConfigured')?.ok, true);
});
