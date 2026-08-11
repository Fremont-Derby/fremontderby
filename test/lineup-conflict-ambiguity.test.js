import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260811014000_fix_lineup_conflict_ambiguity.sql',
  import.meta.url,
);

test('submit_team_lineup targets the named unique constraint', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /on conflict on constraint team_lineups_team_match_id_team_id_key/i);
  assert.match(sql, /on conflict \(team_match_id, team_id\)/i);
});
