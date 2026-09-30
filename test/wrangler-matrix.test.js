import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  assertWranglerMatrix,
  parseWrangler,
  PRODUCTION_REF,
  STAGING_REF,
} from '../scripts/assert-wrangler-matrix.mjs';

const matrix = JSON.parse(
  readFileSync(new URL('../docs/deployment-matrix.json', import.meta.url), 'utf8'),
);

function cloneConfig() {
  return parseWrangler(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
}

test('checked-in wrangler.jsonc matches the deployment matrix', () => {
  const config = cloneConfig();
  const failures = assertWranglerMatrix(config, matrix);
  assert.deepEqual(failures, []);
  assert.equal(config.name, 'fremontderby');
  assert.equal(config.vars.ENVIRONMENT, 'production');
  assert.equal(config.vars.EXPECTED_SUPABASE_PROJECT_REF, PRODUCTION_REF);
  assert.equal(config.env.dru.name, 'fremontderby-dru');
  assert.equal(config.env.jfl.vars.EXPECTED_SUPABASE_PROJECT_REF, STAGING_REF);
  assert.equal(config.env.gamma.vars.SUPABASE_SCHEMA, 'gamma');
});

test('JFL/DRU/gamma aimed at production Supabase fails (regression fixture)', () => {
  for (const lane of ['jfl', 'dru', 'gamma']) {
    const bad = cloneConfig();
    bad.env[lane].vars.SUPABASE_URL = `https://${PRODUCTION_REF}.supabase.co`;
    bad.env[lane].vars.EXPECTED_SUPABASE_PROJECT_REF = PRODUCTION_REF;
    const failures = assertWranglerMatrix(bad, matrix);
    assert.ok(
      failures.some((item) => item.includes('production Supabase')),
      `${lane} should fail when pointed at production`,
    );
  }
});

test('production aimed at the staging project fails', () => {
  const bad = cloneConfig();
  bad.vars.SUPABASE_URL = `https://${STAGING_REF}.supabase.co`;
  bad.vars.EXPECTED_SUPABASE_PROJECT_REF = STAGING_REF;
  const failures = assertWranglerMatrix(bad, matrix);
  assert.ok(failures.some((item) => item.includes('non-prod Supabase')));
});

test('wrong Worker name or schema fails the matrix', () => {
  const badWorker = cloneConfig();
  badWorker.env.dru.name = 'fremontderby';
  assert.ok(
    assertWranglerMatrix(badWorker, matrix).some((item) => item.includes('worker')),
  );

  const badSchema = cloneConfig();
  badSchema.env.jfl.vars.SUPABASE_SCHEMA = 'public';
  assert.ok(
    assertWranglerMatrix(badSchema, matrix).some((item) => item.includes('schema')),
  );
});

test('enabling workers_dev or preview_urls fails', () => {
  const badDev = cloneConfig();
  badDev.env.gamma.workers_dev = true;
  assert.ok(
    assertWranglerMatrix(badDev, matrix).some((item) => item.includes('workers_dev')),
  );

  const badPreview = cloneConfig();
  badPreview.preview_urls = true;
  assert.ok(
    assertWranglerMatrix(badPreview, matrix).some((item) => item.includes('preview_urls')),
  );
});

test('missing or duplicated domain routes fail', () => {
  const missing = cloneConfig();
  missing.env.dru.routes = [];
  assert.ok(
    assertWranglerMatrix(missing, matrix).some((item) =>
      item.includes('missing custom_domain route for dru.fremontderby.com'),
    ),
  );

  const dup = cloneConfig();
  dup.env.jfl.routes = [{ pattern: 'dru.fremontderby.com', custom_domain: true }];
  const failures = assertWranglerMatrix(dup, matrix);
  assert.ok(
    failures.some(
      (item) =>
        item.includes('domain dru.fremontderby.com attached to both') ||
        item.includes('missing custom_domain route for jfl.fremontderby.com'),
    ),
  );
});

test('SUPABASE_URL and EXPECTED_SUPABASE_PROJECT_REF disagreement fails', () => {
  const bad = cloneConfig();
  bad.env.gamma.vars.SUPABASE_URL = `https://${STAGING_REF}.supabase.co`;
  bad.env.gamma.vars.EXPECTED_SUPABASE_PROJECT_REF = 'wrongref000000000000';
  const failures = assertWranglerMatrix(bad, matrix);
  assert.ok(failures.some((item) => item.includes('disagrees') || item.includes('project ref')));
});

test('JFL/DRU reporting production ENVIRONMENT fails worker/env matrix identity', () => {
  // Regression: lane Worker still named correctly but ENVIRONMENT drifted to production.
  const bad = cloneConfig();
  bad.env.dru.vars.ENVIRONMENT = 'production';
  const failures = assertWranglerMatrix(bad, matrix);
  assert.ok(
    failures.some(
      (item) =>
        item.includes('ENVIRONMENT production != matrix dru') ||
        item.includes('non-prod profile points at production') === false,
    ) || failures.length > 0,
  );
  // Explicit: matrix lane dru must still match ENVIRONMENT=dru.
  assert.ok(failures.some((item) => item.includes('ENVIRONMENT')));
});
