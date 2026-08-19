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
import {
  scrubSqlStatements,
  describeScrubPolicy,
} from '../scripts/gamma-refresh/scrub-policy.mjs';

test('production and gamma project refs + target schema are locked', () => {
  assert.equal(PRODUCTION_PROJECT_REF, 'cpiucsxlkicmlbvdvhww');
  assert.equal(GAMMA_STAGING_PROJECT_REF, 'oqkkvqkerusepyokzbmt');
  assert.equal(ALLOWED_TARGET_SCHEMA, 'gamma');
  assert.notEqual(PRODUCTION_PROJECT_REF, GAMMA_STAGING_PROJECT_REF);
});

test('projectRefFromDatabaseUrl parses db.<ref>.supabase.co hosts', () => {
  assert.equal(
    projectRefFromDatabaseUrl('postgres://u:p@db.cpiucsxlkicmlbvdvhww.supabase.co:5432/postgres'),
    'cpiucsxlkicmlbvdvhww',
  );
  assert.equal(projectRefFromDatabaseUrl(''), null);
  assert.equal(projectRefFromDatabaseUrl('postgres://localhost/postgres'), null);
});

test('projectRefFromSupabaseUrl parses https://<ref>.supabase.co', () => {
  assert.equal(
    projectRefFromSupabaseUrl('https://oqkkvqkerusepyokzbmt.supabase.co'),
    'oqkkvqkerusepyokzbmt',
  );
  assert.equal(projectRefFromSupabaseUrl('not-a-url'), null);
});

test('evaluateGammaRefreshPreflight allows prod source → gamma staging target', () => {
  const result = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetSchema: 'gamma',
  });
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.targetSchema, 'gamma');
});

test('evaluateGammaRefreshPreflight fails closed on production write target', () => {
  const toProd = evaluateGammaRefreshPreflight({
    sourceProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetProjectRef: PRODUCTION_PROJECT_REF,
    targetSchema: 'gamma',
  });
  assert.equal(toProd.ok, false);
  assert.ok(toProd.errors.some((e) => /production project cannot be the refresh write target/i.test(e)));
});

test('evaluateGammaRefreshPreflight refuses same-ref, wrong schema, and non-gamma target project', () => {
  const same = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: PRODUCTION_PROJECT_REF,
    targetSchema: 'gamma',
  });
  assert.equal(same.ok, false);
  assert.ok(same.errors.some((e) => /must differ/i.test(e)));

  const badSchema = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetSchema: 'public',
  });
  assert.equal(badSchema.ok, false);
  assert.ok(badSchema.errors.some((e) => /Target schema must be "gamma"/i.test(e)));

  const jflSchema = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetSchema: 'jfl',
  });
  assert.equal(jflSchema.ok, false);

  const wrongTarget = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: 'notgamma00000000000',
    targetSchema: 'gamma',
  });
  assert.equal(wrongTarget.ok, false);
  assert.ok(wrongTarget.errors.some((e) => /expected gamma staging project/i.test(e)));
});

test('scrub policy nulls phones in gamma schema only', () => {
  const policy = describeScrubPolicy();
  assert.equal(policy.version, 1);
  assert.ok(policy.actions.some((a) => /one-way/i.test(a)));
  assert.ok(scrubSqlStatements.length >= 1);
  for (const sql of scrubSqlStatements) {
    assert.match(sql, /gamma\./);
    assert.doesNotMatch(sql, /\bpublic\./);
  }
});
