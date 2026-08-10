import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260810225000_season_registration_foundation.sql',
  import.meta.url,
);

test('season registration migration keeps writes behind service-role RPCs', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /create or replace function public\.register_for_season/);
  assert.match(sql, /create or replace function public\.get_own_season_registration/);
  assert.match(sql, /on conflict \(season_id, player_id\)/);
  assert.match(sql, /insert into private\.payment_status/);
  assert.match(sql, /Season registration is not open/);
  assert.match(sql, /revoke all on function public\.register_for_season[\s\S]*public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.register_for_season[\s\S]*service_role/);
  assert.match(sql, /left join private\.payment_status/);
});

test('season registration migration enforces team/free-agent consistency', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /Active team membership is required for rostered registration/);
  assert.match(sql, /Rostered players cannot register as free agents for the same season/);
  assert.match(sql, /tm\.ends_at is null/);
});
