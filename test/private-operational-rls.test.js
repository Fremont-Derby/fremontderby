import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811155000_private_operational_rls.sql',
  import.meta.url,
);

const tables = [
  'audit_events',
  'free_agent_availability',
  'league_admins',
  'payment_status',
  'player_contacts',
  'player_match_score_submissions',
  'roster_availability',
  'team_invitations',
  'team_lineup_slots',
  'team_lineups',
  'team_trades',
];

test('private operational migration enables RLS and keeps browser roles denied', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  for (const table of tables) {
    assert.match(
      sql,
      new RegExp(`alter table private\\.${table} enable row level security;`, 'i'),
      `${table} must enable RLS`,
    );
    assert.match(
      sql,
      new RegExp(`revoke all on private\\.${table} from public, anon, authenticated;`, 'i'),
      `${table} must keep browser roles explicitly denied`,
    );
  }

  assert.doesNotMatch(sql, /create\s+policy/i, 'private operational tables should not gain browser RLS policies');
  assert.doesNotMatch(sql, /grant\s+.*\s+to\s+(anon|authenticated)/i, 'browser table grants must not be introduced');
});
