import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PRODUCTION_PROJECT_REF,
  GAMMA_STAGING_PROJECT_REF,
  ALLOWED_TARGET_SCHEMA,
} from '../scripts/gamma-refresh/preflight.mjs';

/** Canonical dual-project isolation (prod vs shared staging for lanes). */
const EXPECTED = Object.freeze({
  production: 'cpiucsxlkicmlbvdvhww',
  staging: 'oqkkvqkerusepyokzbmt',
  gammaSchema: 'gamma',
});

test('preflight constants match expected dual-project isolation', () => {
  assert.equal(PRODUCTION_PROJECT_REF, EXPECTED.production);
  assert.equal(GAMMA_STAGING_PROJECT_REF, EXPECTED.staging);
  assert.equal(ALLOWED_TARGET_SCHEMA, EXPECTED.gammaSchema);
  assert.notEqual(PRODUCTION_PROJECT_REF, GAMMA_STAGING_PROJECT_REF);
});

test('wrangler production vars point at production project only', () => {
  const text = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  // Top-level (production) vars
  assert.match(text, new RegExp(`"EXPECTED_SUPABASE_PROJECT_REF":\\s*"${EXPECTED.production}"`));
  assert.match(text, new RegExp(`"SUPABASE_URL":\\s*"https://${EXPECTED.production}\\.supabase\\.co"`));
  // Must not use staging ref at top level
  assert.doesNotMatch(
    text,
    new RegExp(
      `"vars"\\s*:\\s*\\{[\\s\\S]*?"EXPECTED_SUPABASE_PROJECT_REF"\\s*:\\s*"${EXPECTED.staging}"`,
    ),
  );
});

test('wrangler lane + staging envs point at staging project', () => {
  const text = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  for (const lane of ['staging', 'jfl', 'dru', 'gamma']) {
    // Each env block should contain the staging project ref
    const envRe = new RegExp(
      `"${lane}"\\s*:\\s*\\{[\\s\\S]*?"EXPECTED_SUPABASE_PROJECT_REF"\\s*:\\s*"${EXPECTED.staging}"`,
    );
    assert.match(text, envRe, `env.${lane} must set EXPECTED_SUPABASE_PROJECT_REF to staging project`);
  }
});

test('gamma schema is the only allowed refresh target schema', () => {
  assert.equal(ALLOWED_TARGET_SCHEMA, 'gamma');
  assert.ok(!['jfl', 'dru', 'public', 'production'].includes(ALLOWED_TARGET_SCHEMA));
});

test('buildRefreshPlan surfaces the locked refs (smoke of export path)', async () => {
  const { buildRefreshPlan } = await import('../scripts/gamma-prod-refresh.mjs');
  const plan = buildRefreshPlan({ GAMMA_REFRESH_EXECUTE: '' });
  assert.equal(plan.sourceProjectRef, EXPECTED.production);
  assert.equal(plan.targetProjectRef, EXPECTED.staging);
  assert.equal(plan.targetSchema, EXPECTED.gammaSchema);
  assert.equal(plan.dryRun, true);
});
