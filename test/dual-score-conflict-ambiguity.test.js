import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260811021500_fix_dual_score_conflict_ambiguity.sql',
  import.meta.url,
);

test('record_player_match_score_rack targets the named unique constraint', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /on conflict on constraint player_match_score_submission_player_match_id_tracker_playe_key/i);
  assert.match(sql, /on conflict \(player_match_id, tracker_player_id\)/i);
});