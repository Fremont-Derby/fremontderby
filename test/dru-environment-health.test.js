import assert from 'node:assert/strict';
import test from 'node:test';
import { routeDruEnvironmentHealth } from '../src/druEnvironmentHttp.js';

test('DRU /health/environment names host, schema, project ref, and host match', async () => {
  const response = routeDruEnvironmentHealth(
    new Request('https://dru.fremontderby.com/health/environment'),
    {
      ENVIRONMENT: 'dru',
      SUPABASE_URL: 'https://oqkkvqkerusepyokzbmt.supabase.co',
      SUPABASE_SCHEMA: 'dru',
      SUPABASE_PUBLISHABLE_KEY: 'pub',
      SUPABASE_SERVICE_ROLE_KEY: 'role',
      EXPECTED_SUPABASE_PROJECT_REF: 'oqkkvqkerusepyokzbmt',
      BETA_AUTH_BYPASS: '1',
      BETA_ACTOR_USER_ID: 'actor',
      CF_VERSION_METADATA: { id: 'test', tag: 'abc', timestamp: '2026-09-04T00:00:00Z' },
    },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.environment, 'dru');
  assert.equal(body.host, 'dru.fremontderby.com');
  assert.equal(body.expectedHostEnvironment, 'dru');
  assert.equal(body.hostMatchesEnvironment, true);
  assert.equal(body.expectedSupabaseSchema, 'dru');
  assert.equal(body.expectedSupabaseProjectRef, 'oqkkvqkerusepyokzbmt');
  assert.equal(body.ok, true);
  assert.doesNotMatch(JSON.stringify(body), /SUPABASE_SERVICE_ROLE_KEY|role/);
});

test('DRU /health/environment is 503 when bindings are missing', async () => {
  const response = routeDruEnvironmentHealth(
    new Request('https://dru.fremontderby.com/health/environment'),
    { ENVIRONMENT: 'dru' },
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.environment, 'dru');
  assert.equal(body.hostMatchesEnvironment, true);
  assert.equal(body.ok, false);
});
