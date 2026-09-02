import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  privatePostgrestProfile,
  resolvePostgrestProfile,
} from '../src/supabaseSchema.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('shared staging exposes lane private schemas to PostgREST', () => {
  const sql = readFileSync(
    join(root, 'supabase/migrations/20260814093000_expose_lane_private_postgrest_schemas.sql'),
    'utf8',
  );
  assert.match(sql, /jfl_private/);
  assert.match(sql, /dru_private/);
  assert.match(sql, /gamma_private/);
  assert.match(sql, /reload config/);
  assert.match(sql, /reload schema/);
});

test('supabaseSchema maps private profile to lane_private', () => {
  assert.equal(privatePostgrestProfile('public'), 'private');
  assert.equal(privatePostgrestProfile('jfl'), 'jfl_private');
  assert.equal(privatePostgrestProfile('dru'), 'dru_private');
  assert.equal(privatePostgrestProfile('gamma'), 'gamma_private');

  assert.equal(resolvePostgrestProfile('jfl', 'private'), 'jfl_private');
  assert.equal(resolvePostgrestProfile('dru', 'private'), 'dru_private');
  assert.equal(resolvePostgrestProfile('gamma', 'private'), 'gamma_private');
  assert.equal(resolvePostgrestProfile('public', 'private'), 'private');
  assert.equal(resolvePostgrestProfile('jfl', 'jfl_private'), 'jfl_private');
  assert.equal(resolvePostgrestProfile('jfl', ''), 'jfl');
  assert.equal(resolvePostgrestProfile('jfl', 'dru'), 'jfl');
});
