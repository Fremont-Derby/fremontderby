import test from 'node:test';
import assert from 'node:assert/strict';
import { environmentReadiness } from '../src/environmentReadiness.js';

test('jfl readiness fails closed without secrets', () => {
  const r = environmentReadiness({
    ENVIRONMENT: 'jfl',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: 'b22805b6-92ba-44bd-a92e-0c82f0be6613',
    SUPABASE_SCHEMA: 'jfl',
  });
  assert.equal(r.ok, false);
  assert.ok(r.checks.some((c) => c.name === 'supabaseUrlConfigured' && !c.ok));
});

test('jfl readiness passes with staging project + distinct keys', () => {
  const r = environmentReadiness({
    ENVIRONMENT: 'jfl',
    BETA_AUTH_BYPASS: '1',
    BETA_ACTOR_USER_ID: 'b22805b6-92ba-44bd-a92e-0c82f0be6613',
    SUPABASE_SCHEMA: 'jfl',
    SUPABASE_URL: 'https://oqkkvqkerusepyokzbmt.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'pub-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  });
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter((c) => !c.ok)));
});
