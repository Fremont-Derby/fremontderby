import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811024500_direct_messaging_active_season_guard.sql',
  import.meta.url,
);
const sql = await readFile(migrationUrl, 'utf8');

test('completed-season direct conversations remain visible but become read-only', () => {
  assert.match(sql, /create or replace function public\.get_my_direct_message_inbox/);
  assert.match(sql, /private\.is_active_season_participant\(actor_player_id, conversation\.season_id\)/);
  assert.match(sql, /private\.is_active_season_participant\(other_player\.id, conversation\.season_id\)/);
  assert.match(sql, /create or replace function public\.send_direct_message/);
  assert.match(sql, /private\.is_active_season_participant\(actor_player\.id, conversation\.season_id\)/);
  assert.match(sql, /Both players must participate in the active season/);
});

test('active-season guard RPCs stay service-role only', () => {
  assert.match(sql, /revoke all on function public\.get_my_direct_message_inbox\(uuid\) from public, anon, authenticated/);
  assert.match(sql, /revoke all on function public\.send_direct_message\(uuid, uuid, text, uuid\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.send_direct_message\(uuid, uuid, text, uuid\) to service_role/);
});
