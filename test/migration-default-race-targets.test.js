import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(
  join(root, 'supabase/migrations/20260816083000_lock_player_match_ratings_default_race_targets.sql'),
  'utf8',
);

test('migration defaults provisional fargo and race targets', () => {
  assert.match(sql, /coalesce\(rating_a\.fargo_rating, 500\)/);
  assert.match(sql, /coalesce\(new\.race_to_a, 5\)/);
  assert.match(sql, /lock_player_match_ratings/);
});
