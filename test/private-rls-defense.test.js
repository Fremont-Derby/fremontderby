import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('private RLS defense-in-depth migration enables RLS without browser policies', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260816250000_private_schema_rls_defense_in_depth.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /enable row level security/);
  assert.match(sql, /audit_events/);
  assert.match(sql, /player_contacts/);
  assert.match(sql, /team_lineups/);
  assert.match(sql, /revoke all on table private/);
  assert.doesNotMatch(sql, /create policy.*anon/i);
  assert.doesNotMatch(sql, /for select to authenticated/i);
});
