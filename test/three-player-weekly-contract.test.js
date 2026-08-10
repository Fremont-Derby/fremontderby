import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  new URL('../supabase/migrations/20260810230000_three_player_weekly_lineups.sql', import.meta.url),
  'utf8',
);

test('weekly lineups are capped at three active slots', () => {
  assert.match(sql, /check \(slot_number between 1 and 3\)/i);
  assert.match(sql, /jsonb_array_length\(lineup_slots\) > 3/i);
  assert.match(sql, /Lineup cannot contain more than three slots/i);
  assert.match(sql, /slot_number > 3/i);
  assert.match(sql, /generate_series\(1, 3\)/i);
  assert.doesNotMatch(sql, /generate_series\(1, 4\)/i);
});

test('generated weekly team results require exactly three slots', () => {
  assert.match(sql, /team_a_slot_count <> 3 or team_b_slot_count <> 3/i);
  assert.match(sql, /having count\(distinct sr\.slot_number\) = 3/i);
});

test('regular-season standings cannot record draws', () => {
  assert.match(sql, /0::integer as team_draws/i);
  assert.match(sql, /sum\(tmr\.team_wins \* 2\)/i);
  assert.doesNotMatch(sql, /team_wins \* 2 \+ tmr\.team_draws/i);
});

test('double-empty slots do not manufacture a completed regular-season result', () => {
  assert.match(
    sql,
    /not exists \([\s\S]*public\.team_match_forfeits unresolved[\s\S]*unresolved\.credited_team_id is null[\s\S]*\)/i,
  );
});
