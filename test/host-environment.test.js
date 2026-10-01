import assert from 'node:assert/strict';
import test from 'node:test';
import {
  expectedEnvironmentForHost,
  hostMatchesEnvironment,
  normalizeRequestHost,
} from '../src/hostEnvironment.js';
import { environmentReadiness } from '../src/environmentReadiness.js';

test('lane hosts map to lane environments', () => {
  assert.equal(expectedEnvironmentForHost('dru.fremontderby.com'), 'dru');
  assert.equal(expectedEnvironmentForHost('JFL.fremontderby.com:443'), 'jfl');
  assert.equal(expectedEnvironmentForHost('fremontderby.com'), 'production');
  assert.equal(expectedEnvironmentForHost('localhost'), null);
});

test('host mismatch fails readiness when Host is a known lane', () => {
  const readiness = environmentReadiness(
    {
      ENVIRONMENT: 'production',
      SUPABASE_URL: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
      SUPABASE_SCHEMA: 'public',
      SUPABASE_PUBLISHABLE_KEY: 'pub',
      SUPABASE_SERVICE_ROLE_KEY: 'role',
    },
    { host: 'dru.fremontderby.com' },
  );
  assert.equal(readiness.environment, 'production');
  assert.equal(readiness.hostMatchesEnvironment, false);
  assert.equal(readiness.ok, false);
  assert.ok(readiness.checks.some((c) => c.name === 'requestHostMatchesWorkerEnvironment' && !c.ok));
});

test('matching lane host keeps readiness focused on env config', () => {
  const readiness = environmentReadiness(
    {
      ENVIRONMENT: 'dru',
      SUPABASE_URL: 'https://oqkkvqkerusepyokzbmt.supabase.co',
      SUPABASE_SCHEMA: 'dru',
      SUPABASE_PUBLISHABLE_KEY: 'pub',
      SUPABASE_SERVICE_ROLE_KEY: 'role',
      BETA_AUTH_BYPASS: '1',
      BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
    },
    { host: 'dru.fremontderby.com' },
  );
  assert.equal(readiness.hostMatchesEnvironment, true);
  assert.equal(hostMatchesEnvironment('dru.fremontderby.com', 'dru'), true);
  assert.equal(normalizeRequestHost('dru.fremontderby.com:443'), 'dru.fremontderby.com');
});
