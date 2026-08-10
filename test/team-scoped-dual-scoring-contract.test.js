import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  new URL('../supabase/migrations/20260810231000_team_scoped_dual_scoring.sql', import.meta.url),
  'utf8',
);

test('dual scoring resolves the editable side from active team membership', () => {
  assert.match(sql, /from public\.team_memberships tm/i);
  assert.match(sql, /tm\.ends_at is null/i);
  assert.match(sql, /tm\.team_id in \(target_match\.team_a_id, target_match\.team_b_id\)/i);
  assert.match(sql, /then target_match\.player_a_id/i);
  assert.match(sql, /then target_match\.player_b_id/i);
});

test('a scorer cannot resolve both teams or an unrelated team', () => {
  assert.match(sql, /bool_or\(team_id = target_match\.team_a_id\)/i);
  assert.match(sql, /not coalesce\(bool_or\(team_id = target_match\.team_b_id\), false\)/i);
  assert.match(sql, /bool_or\(team_id = target_match\.team_b_id\)/i);
  assert.match(sql, /else null/i);
});

test('the dual score remains one shared history per active match side', () => {
  assert.match(sql, /tracker_player_id identifies the active match participant whose team owns the history/i);
  assert.match(sql, /any authenticated active teammate on that team may maintain it/i);
});
