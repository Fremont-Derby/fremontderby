import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_PROJECT_REF,
  GAMMA_STAGING_PROJECT_REF,
  ALLOWED_TARGET_SCHEMA,
  projectRefFromDatabaseUrl,
  projectRefFromSupabaseUrl,
  evaluateGammaRefreshPreflight,
} from '../scripts/gamma-refresh/preflight.mjs';
import { buildRefreshPlan } from '../scripts/gamma-prod-refresh.mjs';

test('project refs parse from database and supabase URLs', () => {
  assert.equal(
    projectRefFromDatabaseUrl('postgres://u:p@db.cpiucsxlkicmlbvdvhww.supabase.co:5432/postgres'),
    'cpiucsxlkicmlbvdvhww',
  );
  assert.equal(
    projectRefFromSupabaseUrl('https://oqkkvqkerusepyokzbmt.supabase.co'),
    'oqkkvqkerusepyokzbmt',
  );
  assert.equal(projectRefFromDatabaseUrl(''), null);
});

test('evaluateGammaRefreshPreflight allows production → staging gamma schema', () => {
  const result = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetSchema: ALLOWED_TARGET_SCHEMA,
  });
  assert.equal(result.ok, true);
  assert.equal(result.targetSchema, 'gamma');
});

test('evaluateGammaRefreshPreflight refuses production write target and same-project copy', () => {
  assert.equal(
    evaluateGammaRefreshPreflight({
      sourceProjectRef: PRODUCTION_PROJECT_REF,
      targetProjectRef: PRODUCTION_PROJECT_REF,
      targetSchema: 'gamma',
    }).ok,
    false,
  );
  const same = evaluateGammaRefreshPreflight({
    sourceProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetSchema: 'gamma',
  });
  assert.equal(same.ok, false);
  assert.ok(same.errors.some((e) => /must differ/.test(e)));
});

test('evaluateGammaRefreshPreflight refuses jfl/dru/public target schemas', () => {
  for (const targetSchema of ['jfl', 'dru', 'public']) {
    const result = evaluateGammaRefreshPreflight({
      sourceProjectRef: PRODUCTION_PROJECT_REF,
      targetProjectRef: GAMMA_STAGING_PROJECT_REF,
      targetSchema,
    });
    assert.equal(result.ok, false, targetSchema);
  }
});

test('buildRefreshPlan is dry-run by default and fails closed without usable refs', () => {
  const plan = buildRefreshPlan({});
  assert.equal(plan.dryRun, true);
  assert.equal(plan.targetSchema, 'gamma');
  assert.equal(plan.sourceProjectRef, PRODUCTION_PROJECT_REF);
  assert.equal(plan.targetProjectRef, GAMMA_STAGING_PROJECT_REF);
  assert.equal(plan.preflight.ok, true);
});
