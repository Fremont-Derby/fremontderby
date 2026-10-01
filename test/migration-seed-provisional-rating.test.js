import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../supabase/migrations/20260816090000_seed_provisional_rating_on_player_insert.sql'), 'utf8');
test('seeds provisional rating on player insert', () => {
  assert.match(sql, /seed_provisional_player_rating/);
  assert.match(sql, /fargo_rating, rating_status/);
  assert.match(sql, /500/);
  assert.match(sql, /provisional/);
});
