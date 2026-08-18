import test from 'node:test';
import assert from 'node:assert/strict';
import {
  projectRefFromDatabaseUrl,
  projectRefFromSupabaseUrl,
} from '../scripts/gamma-refresh/preflight.mjs';

test('projectRefFromDatabaseUrl parses db.<ref>.supabase.co', () => {
  assert.equal(
    projectRefFromDatabaseUrl('postgresql://u:p@db.cpiucsxlkicmlbvdvhww.supabase.co:5432/postgres'),
    'cpiucsxlkicmlbvdvhww',
  );
});

test('projectRefFromSupabaseUrl parses https://<ref>.supabase.co', () => {
  assert.equal(
    projectRefFromSupabaseUrl('https://oqkkvqkerusepyokzbmt.supabase.co'),
    'oqkkvqkerusepyokzbmt',
  );
});

test('projectRef parsers return null for empty/invalid input', () => {
  assert.equal(projectRefFromDatabaseUrl(''), null);
  assert.equal(projectRefFromDatabaseUrl('not-a-url'), null);
  assert.equal(projectRefFromSupabaseUrl(''), null);
  assert.equal(projectRefFromSupabaseUrl('https://example.com'), null);
});
