import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811050000_bootstrap_season_one_chat_registration.sql',
  import.meta.url,
);

test('new profiles auto-register only when one season is open', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /open_season_count <> 1/);
  assert.match(sql, /after insert on public\.players/);
  assert.match(sql, /insert into public\.season_players/);
  assert.match(sql, /'free_agent', 'active'/);
  assert.match(sql, /insert into private\.payment_status/);
  assert.match(sql, /'unpaid'/);
});

test('empty environments receive one registration season and existing profiles are backfilled', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /not exists \(select 1 from public\.seasons\)/);
  assert.match(sql, /values \('Season 1', 'registration'\)/);
  assert.match(sql, /select target_season_id, player\.id, 'free_agent', 'active'/);
  assert.match(sql, /on conflict \(season_id, player_id\) do nothing/);
});

test('automatic registration stays behind the private trigger boundary', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /revoke all on function private\.auto_register_new_player_for_open_season\(\)[\s\S]*public, anon, authenticated/);
  assert.doesNotMatch(sql, /grant execute[\s\S]*to anon|grant execute[\s\S]*to authenticated/);
});
