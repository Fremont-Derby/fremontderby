import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  environmentReadiness,
  supabaseProjectRefFromUrl,
} from '../src/environmentReadiness.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseJsonc(text) {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\/g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(stripped);
}

const PRODUCTION_REF = 'cpiucsxlkicmlbvdvhww';
const STAGING_REF = 'oqkkvqkerusepyokzbmt';

test('supabaseProjectRefFromUrl parses supabase.co project refs', () => {
  assert.equal(
    supabaseProjectRefFromUrl(`https://${PRODUCTION_REF}.supabase.co`),
    PRODUCTION_REF,
  );
  assert.equal(supabaseProjectRefFromUrl('https://example.com'), null);
  assert.equal(supabaseProjectRefFromUrl(''), null);
});

test('production readiness expects production project + public schema', () => {
  const result = environmentReadiness({
    ENVIRONMENT: 'production',
    SUPABASE_URL: `https://${PRODUCTION_REF}.supabase.co`,
    SUPABASE_SCHEMA: 'public',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    SUPABASE_SERVICE_ROLE_KEY: 'role',
  });
  assert.equal(result.expectedSupabaseProjectRef, PRODUCTION_REF);
  assert.equal(result.expectedSupabaseSchema, 'public');
  assert.equal(result.expectedPrivateSupabaseSchema, 'private');
  assert.ok(result.checks.find((c) => c.name === 'supabaseProjectMatchesEnvironment')?.ok);
  assert.ok(result.checks.find((c) => c.name === 'supabaseSchemaMatchesEnvironment')?.ok);
});

test('jfl/dru/gamma expect staging project ref + lane schema and stay isolated from production', () => {
  for (const lane of ['jfl', 'dru', 'gamma']) {
    const result = environmentReadiness({
      ENVIRONMENT: lane,
      SUPABASE_URL: `https://${STAGING_REF}.supabase.co`,
      SUPABASE_SCHEMA: lane,
      SUPABASE_PUBLISHABLE_KEY: 'pub',
      SUPABASE_SERVICE_ROLE_KEY: 'role',
      BETA_AUTH_BYPASS: '1',
      BETA_ACTOR_USER_ID: '00000000-0000-4000-8000-000000000001',
    });
    assert.equal(result.expectedSupabaseProjectRef, STAGING_REF);
    assert.equal(result.expectedSupabaseSchema, lane);
    assert.equal(result.expectedPrivateSupabaseSchema, `${lane}_private`);
    assert.ok(result.checks.find((c) => c.name === 'expectedProjectRefIsolated')?.ok);
    assert.ok(result.checks.find((c) => c.name === 'actualProjectIsolated')?.ok);
    assert.notEqual(result.expectedSupabaseProjectRef, PRODUCTION_REF);
  }
});

test('lane pointing at production project fails isolation checks', () => {
  const result = environmentReadiness({
    ENVIRONMENT: 'dru',
    SUPABASE_URL: `https://${PRODUCTION_REF}.supabase.co`,
    SUPABASE_SCHEMA: 'dru',
    SUPABASE_PUBLISHABLE_KEY: 'pub',
    SUPABASE_SERVICE_ROLE_KEY: 'role',
    BETA_AUTH_BYPASS: '1',
  });
  assert.equal(result.ok, false);
  assert.ok(result.checks.find((c) => c.name === 'actualProjectIsolated' && !c.ok));
});

test('environmentReadiness expected refs match wrangler.jsonc', () => {
  const cfg = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(cfg.vars.EXPECTED_SUPABASE_PROJECT_REF, PRODUCTION_REF);
  for (const lane of ['jfl', 'dru', 'gamma', 'staging']) {
    assert.equal(
      cfg.env[lane].vars.EXPECTED_SUPABASE_PROJECT_REF,
      STAGING_REF,
      `${lane} wrangler project ref must match readiness fixed map`,
    );
  }
});
