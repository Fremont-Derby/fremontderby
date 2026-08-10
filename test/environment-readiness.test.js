import test from 'node:test';
import assert from 'node:assert/strict';
import {
  environmentReadiness,
  supabaseProjectRefFromUrl,
} from '../src/environmentReadiness.js';

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
  assert.equal(readiness.expectedSupabaseProjectRef, 'cpiucsxlkicmlbvdvhww');
  assert.deepEqual(readiness.supabase, {
    url: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
    projectRef: 'cpiucsxlkicmlbvdvhww',
    hasPublishableKey: true,
    hasServiceRoleKey: true,
  });
  assert.equal(readiness.checks.every((check) => check.ok), true);
});

test('staging readiness fails if it points at the production project', () => {
  const readiness = environmentReadiness({
    ENVIRONMENT: 'staging',
    SUPABASE_URL: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  });

  assert.equal(readiness.ok, false);
  assert.equal(readiness.expectedSupabaseProjectRef, 'oqkkvqkerusepyokzbmt');
  const matchCheck = readiness.checks.find(
    (check) => check.name === 'supabaseProjectMatchesEnvironment',
  );
  assert.deepEqual(matchCheck, {
    name: 'supabaseProjectMatchesEnvironment',
    ok: false,
    expectedProjectRef: 'oqkkvqkerusepyokzbmt',
    projectRef: 'cpiucsxlkicmlbvdvhww',
  });
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
