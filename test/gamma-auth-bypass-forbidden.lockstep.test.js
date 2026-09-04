import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  betaAuthBypassEnabled,
  authenticateSupabaseUser,
  TEST_LANE_DEFAULT_ACTORS,
} from '../src/supabaseAuth.js';
import { environmentReadiness } from '../src/environmentReadiness.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseJsonc(text) {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');
  return JSON.parse(stripped);
}

test('gamma never enables beta auth bypass even when flag is set', () => {
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'gamma', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'gamma' }), false);
  assert.equal(TEST_LANE_DEFAULT_ACTORS.gamma, undefined);
});

test('jfl and dru still allow bypass; production and staging do not', () => {
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'jfl' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'dru', BETA_AUTH_BYPASS: '1' }), true);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'production', BETA_AUTH_BYPASS: '1' }), false);
  assert.equal(betaAuthBypassEnabled({ ENVIRONMENT: 'staging', BETA_AUTH_BYPASS: '1' }), false);
});

test('gamma unauthenticated requests fail closed without shared actor', async () => {
  await assert.rejects(
    () => authenticateSupabaseUser(
      new Request('https://gamma.fremontderby.com/api/test'),
      {
        ENVIRONMENT: 'gamma',
        BETA_AUTH_BYPASS: '1',
        SUPABASE_URL: 'https://oqkkvqkerusepyokzbmt.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'pub',
      },
    ),
    (error) => error.name === 'AuthError' && /Missing bearer token/.test(error.message),
  );
});

test('gamma readiness fails when BETA_AUTH_BYPASS is declared on', () => {
  const result = environmentReadiness({
    ENVIRONMENT: 'gamma',
    SUPABASE_URL: 'https://oqkkvqkerusepyokzbmt.supabase.co',
    SUPABASE_SCHEMA: 'gamma',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    SUPABASE_SERVICE_ROLE_KEY: 'role',
    BETA_AUTH_BYPASS: '1',
  });
  assert.equal(result.ok, false);
  assert.ok(result.checks.find((c) => c.name === 'authBypassRestrictedToTestLane' && !c.ok));
});

test('wrangler gamma env does not declare BETA_AUTH_BYPASS', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(cfg.env.gamma.vars.BETA_AUTH_BYPASS, undefined);
  assert.equal(cfg.env.jfl.vars.BETA_AUTH_BYPASS, '1');
  assert.equal(cfg.env.dru.vars.BETA_AUTH_BYPASS, '1');
});
