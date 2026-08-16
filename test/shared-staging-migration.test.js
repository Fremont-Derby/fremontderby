import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260814031843_shared_staging_lane_schemas.sql',
  'utf8',
);

test('shared staging migration provisions only the three non-production lanes', () => {
  assert.match(sql, /array\['jfl', 'dru', 'gamma'\]/);
  assert.doesNotMatch(sql, /cpiucsxlkicmlbvdvhww/);
  assert.match(sql, /Refusing to overwrite existing schema for lane/);
});

test('migration exposes all lane schemas and provisions only JFL and DRU actors', () => {
  assert.match(sql, /public,graphql_public,jfl,dru,gamma/);
  assert.match(sql, /jfl-actor@fremontderby\.com/);
  assert.match(sql, /dru-actor@fremontderby\.com/);
  assert.doesNotMatch(sql, /gamma-actor@/);
});
