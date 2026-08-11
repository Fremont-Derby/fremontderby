import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811030000_reuse_single_registration_season_setup.sql',
  import.meta.url,
);

test('season setup RPC reuses the sole registration season when target is omitted', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /if target_season_id is null then/i);
  assert.match(sql, /lock table public\.seasons in share row exclusive mode/i);
  assert.match(sql, /where s\.status = 'registration'/i);
  assert.match(sql, /registration_season_count = 1/i);
  assert.match(sql, /into target_season_id/i);
});

test('season setup RPC refuses an ambiguous implicit target', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /registration_season_count > 1/i);
  assert.match(sql, /Multiple registration seasons exist; choose a season before saving setup/i);
});

test('season setup RPC still creates the first registration season when none exists', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /if target_season_id is null then\s+insert into public\.seasons/i);
  assert.match(sql, /'registration'/i);
});
