import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateGammaRefreshPreflight,
  PRODUCTION_PROJECT_REF,
  GAMMA_STAGING_PROJECT_REF,
  projectRefFromDatabaseUrl,
} from '../scripts/gamma-refresh/preflight.mjs';

test('parses supabase db url project ref', () => {
  const ref = projectRefFromDatabaseUrl(
    'postgresql://postgres:p@db.cpiucsxlkicmlbvdvhww.supabase.co:5432/postgres',
  );
  assert.equal(ref, 'cpiucsxlkicmlbvdvhww');
});

test('refuses production as write target', () => {
  const r = evaluateGammaRefreshPreflight({
    sourceUrl: `postgresql://u:p@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
    targetUrl: `postgresql://u:p@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
    targetSchema: 'gamma',
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /production project/i.test(e)));
});

test('accepts prod source → staging gamma target', () => {
  const r = evaluateGammaRefreshPreflight({
    sourceUrl: `postgresql://u:p@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
    targetUrl: `postgresql://u:p@db.${GAMMA_STAGING_PROJECT_REF}.supabase.co:5432/postgres`,
    targetSchema: 'gamma',
  });
  assert.equal(r.ok, true);
  assert.equal(r.targetSchema, 'gamma');
});

test('refuses jfl schema target', () => {
  const r = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetSchema: 'jfl',
  });
  assert.equal(r.ok, false);
});
