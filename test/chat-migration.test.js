import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260811010000_team_chat_foundation.sql',
  'utf8',
);

test('team chat tables are private behind RLS and service-role RPCs', () => {
  assert.match(sql, /create table public\.team_chat_messages/i);
  assert.match(sql, /create table public\.team_chat_reads/i);
  assert.match(sql, /alter table public\.team_chat_messages enable row level security/i);
  assert.match(sql, /alter table public\.team_chat_reads enable row level security/i);
  assert.match(sql, /revoke all on public\.team_chat_messages, public\.team_chat_reads[\s\S]*from public, anon, authenticated/i);
  assert.doesNotMatch(sql, /grant\s+(?:select|insert|update|delete|all)[^;]*team_chat_messages[^;]*to\s+(?:anon|authenticated)/i);
  assert.doesNotMatch(sql, /security definer/i);
});

test('team chat reads only messages within actor membership windows', () => {
  assert.match(sql, /access_membership\.player_id = actor_player_id/i);
  assert.match(sql, /m\.created_at >= access_membership\.starts_at/i);
  assert.match(sql, /access_membership\.ends_at is null[\s\S]*m\.created_at <= access_membership\.ends_at/i);
});

test('team chat writes require current membership and are idempotent', () => {
  assert.match(sql, /tm\.player_id = actor_player\.id[\s\S]*tm\.ends_at is null/i);
  assert.match(sql, /Active team membership is required to post messages/i);
  assert.match(sql, /unique \(author_player_id, client_message_id\)/i);
  assert.match(sql, /on conflict \(author_player_id, client_message_id\)/i);
});

test('chat RPC execution is restricted to the trusted worker role', () => {
  for (const name of [
    'get_my_team_chat_inbox',
    'list_team_chat_messages',
    'send_team_chat_message',
    'mark_team_chat_read',
  ]) {
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}\\([\\s\\S]*?to service_role;`, 'i'));
  }
});
