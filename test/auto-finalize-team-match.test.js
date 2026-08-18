import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase/migrations/20260816220000_auto_finalize_team_match.sql'),
  'utf8',
);

test('auto-finalize team match migration installs trigger helper', () => {
  assert.match(sql, /maybe_finalize_team_match_from_player_matches/);
  assert.match(sql, /maybe_finalize_team_match_after_player_match/);
  assert.match(sql, /done_slots < 3/);
  assert.match(sql, /status = 'finalized'/);
  assert.match(sql, /winner_team_id/);
});
