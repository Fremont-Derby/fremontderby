import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260811060000_chat_rpc_conflict_target_ambiguity_fix.sql',
  'utf8',
);

test('chat RPC upserts use named constraints instead of ambiguous output-column targets', () => {
  const constraints = [
    'team_chat_messages_author_player_id_client_message_id_key',
    'team_chat_reads_pkey',
    'direct_conversations_season_id_player_low_id_player_high_id_key',
    'direct_messages_author_player_id_client_message_id_key',
    'direct_chat_reads_pkey',
    'player_chat_blocks_pkey',
    'league_chat_messages_author_client_key',
    'league_chat_reads_pkey',
    'matchup_chat_messages_author_player_id_client_message_id_key',
    'matchup_chat_reads_pkey',
  ];

  for (const constraint of constraints) {
    assert.match(sql, new RegExp(`on conflict on constraint ${constraint}`, 'i'));
  }

  assert.doesNotMatch(sql, /on conflict\s*\(/i);
});

test('patched chat RPCs retain the trusted Worker-only execution boundary', () => {
  const functions = [
    ['send_team_chat_message', 'uuid, uuid, text, uuid'],
    ['mark_team_chat_read', 'uuid, uuid, timestamptz'],
    ['start_direct_conversation', 'uuid, uuid, uuid'],
    ['send_direct_message', 'uuid, uuid, text, uuid'],
    ['mark_direct_chat_read', 'uuid, uuid, timestamptz'],
    ['block_player_chat', 'uuid, uuid'],
    ['send_league_chat_message', 'uuid, uuid, text, uuid'],
    ['mark_league_chat_read', 'uuid, uuid, timestamptz'],
    ['send_matchup_chat_message', 'uuid, uuid, text, uuid'],
    ['mark_matchup_chat_read', 'uuid, uuid, timestamptz'],
  ];

  for (const [name, signature] of functions) {
    assert.match(
      sql,
      new RegExp(`revoke all on function public\\.${name}\\(${signature}\\)[\\s\\S]*?from public, anon, authenticated`, 'i'),
    );
    assert.match(
      sql,
      new RegExp(`grant execute on function public\\.${name}\\(${signature}\\)[\\s\\S]*?to service_role`, 'i'),
    );
  }
});
