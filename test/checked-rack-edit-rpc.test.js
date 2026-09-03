import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL(
  '../supabase/migrations/20260903184700_fix_checked_rack_edit_return_shape.sql',
  import.meta.url,
);

test('checked rack edit wrapper returns exactly the underlying nine-column edit shape', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  const returnShape = sql.match(/returns table\(([\s\S]*?)\)\nlanguage plpgsql/i)?.[1] || '';
  const columns = returnShape
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  assert.equal(columns.length, 9);
  assert.match(returnShape, /previous_winner_side text/);
  assert.match(returnShape, /winner_side text/);
  assert.doesNotMatch(returnShape, /record_complete/);
  assert.match(sql, /select \* from public\.update_player_match_score_rack\(/);
  assert.match(sql, /private\.assert_expected_score_history/);
  assert.match(sql, /revoke all on function public\.update_player_match_score_rack_checked[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.update_player_match_score_rack_checked[\s\S]*to service_role/);
});
