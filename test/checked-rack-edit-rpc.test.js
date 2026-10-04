import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const publicMigrationPath = new URL(
  '../supabase/migrations/20260903184700_fix_checked_rack_edit_return_shape.sql',
  import.meta.url,
);
const jflMigrationPath = new URL(
  '../supabase/migrations/20260903190100_jfl_fix_checked_rack_edit_return_shape.sql',
  import.meta.url,
);

function assertNineColumnEditWrapper(sql, schema, privateSchema) {
  sql = sql.replace(/\r\n/g, '\n');
  const returnShape = sql.match(/returns table\(([\s\S]*?)\)\nlanguage plpgsql/i)?.[1] || '';
  const columns = returnShape
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  assert.equal(columns.length, 9);
  assert.match(returnShape, /previous_winner_side text/);
  assert.match(returnShape, /winner_side text/);
  assert.doesNotMatch(returnShape, /record_complete/);
  assert.match(sql, new RegExp(`select \\* from ${schema}\\.update_player_match_score_rack\\(`));
  assert.match(sql, new RegExp(`${privateSchema}\\.assert_expected_score_history`));
  assert.match(sql, new RegExp(`revoke all on function ${schema}\\.update_player_match_score_rack_checked[\\s\\S]*from public, anon, authenticated`));
  assert.match(sql, new RegExp(`grant execute on function ${schema}\\.update_player_match_score_rack_checked[\\s\\S]*to service_role`));
}

test('public checked rack edit wrapper returns exactly the underlying nine-column edit shape', async () => {
  assertNineColumnEditWrapper(await readFile(publicMigrationPath, 'utf8'), 'public', 'private');
});

test('JFL checked rack edit wrapper returns exactly the underlying nine-column edit shape', async () => {
  assertNineColumnEditWrapper(await readFile(jflMigrationPath, 'utf8'), 'jfl', 'jfl_private');
});

test('checked rack edit contract accepts LF and CRLF but rejects malformed shapes', async () => {
  const source = (await readFile(jflMigrationPath, 'utf8')).replace(/\r\n/g, '\n');
  for (const sql of [source, source.replace(/\n/g, '\r\n')]) {
    assertNineColumnEditWrapper(sql, 'jfl', 'jfl_private');
    assert.throws(() => assertNineColumnEditWrapper(sql.replace('previous_winner_side text,', ''), 'jfl', 'jfl_private'));
    assert.throws(() => assertNineColumnEditWrapper(sql.replace('previous_winner_side text', 'record_complete boolean'), 'jfl', 'jfl_private'));
  }
});
