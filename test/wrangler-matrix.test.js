import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertWranglerMatrix, parseWrangler } from '../scripts/assert-wrangler-matrix.mjs';

const matrix = JSON.parse(readFileSync(new URL('../docs/deployment-matrix.json', import.meta.url), 'utf8'));

test('checked-in DRU wrangler stays off the production Supabase project', () => {
  const config = parseWrangler(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  const failures = assertWranglerMatrix(config, matrix);
  assert.deepEqual(failures, []);
  assert.equal(config.name, 'fremontderby-dru');
  assert.equal(config.vars.ENVIRONMENT, 'dru');
  assert.equal(config.vars.EXPECTED_SUPABASE_PROJECT_REF, 'oqkkvqkerusepyokzbmt');
});

test('a lane profile aimed at production Supabase fails the matrix', () => {
  const bad = {
    name: 'fremontderby-dru',
    workers_dev: false,
    preview_urls: false,
    vars: {
      ENVIRONMENT: 'dru',
      SUPABASE_URL: 'https://cpiucsxlkicmlbvdvhww.supabase.co',
      EXPECTED_SUPABASE_PROJECT_REF: 'cpiucsxlkicmlbvdvhww',
      SUPABASE_SCHEMA: 'dru',
    },
  };
  const failures = assertWranglerMatrix(bad, matrix);
  assert.ok(failures.some((item) => item.includes('production Supabase')));
});

test('production aimed at the staging project fails the matrix', () => {
  const bad = {
    name: 'fremontderby',
    workers_dev: false,
    preview_urls: false,
    vars: {
      ENVIRONMENT: 'production',
      SUPABASE_URL: 'https://oqkkvqkerusepyokzbmt.supabase.co',
      EXPECTED_SUPABASE_PROJECT_REF: 'oqkkvqkerusepyokzbmt',
      SUPABASE_SCHEMA: 'public',
    },
  };
  const failures = assertWranglerMatrix(bad, matrix);
  assert.ok(failures.some((item) => item.includes('non-prod Supabase')));
});
