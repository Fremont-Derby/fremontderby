import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(
  join(root, 'supabase/migrations/20260816210000_one_active_team_per_player_season.sql'),
  'utf8',
);

test('migration enforces one active membership per player per season', () => {
  assert.match(sql, /one_active_team_membership_per_player_season/);
  assert.match(sql, /team_memberships \(season_id, player_id\)/);
  assert.match(sql, /where ends_at is null/);
});

test('scorable list de-duplicates by player_match via row_number', () => {
  assert.match(sql, /list_scorable_player_matches/);
  assert.match(sql, /row_number\(\) over \(/);
  assert.match(sql, /partition by pm\.id/);
  assert.match(sql, /where rn = 1/);
});
