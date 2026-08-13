import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const migrationsUrl = new URL('../supabase/migrations/', import.meta.url);

function migration(name) {
  return readFileSync(new URL(name, migrationsUrl), 'utf8');
}

const ratingLock = migration('20260810053000_lock_player_match_ratings.sql');
const raceTargetLock = migration('20260810060000_lock_race_targets.sql');
const generatedMatches = migration('20260810050000_generate_player_matches.sql');
const allMigrationSql = readdirSync(migrationsUrl)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => migration(name))
  .join('\n');

test('player matches snapshot both Fargo ratings when the match row is created', () => {
  assert.match(
    ratingLock,
    /create trigger lock_player_match_ratings_before_insert\s+before insert on public\.player_matches/i,
  );
  assert.match(ratingLock, /new\.player_a_fargo_rating\s*:=\s*rating_a\.fargo_rating/i);
  assert.match(ratingLock, /new\.player_b_fargo_rating\s*:=\s*rating_b\.fargo_rating/i);
  assert.match(ratingLock, /new\.player_a_rating_status\s*:=\s*rating_a\.rating_status/i);
  assert.match(ratingLock, /new\.player_b_rating_status\s*:=\s*rating_b\.rating_status/i);
});

test('race targets are calculated on the server from the insert-time ratings and season chart', () => {
  assert.match(
    raceTargetLock,
    /abs\(rating_a\.fargo_rating\s*-\s*rating_b\.fargo_rating\)\s*<=\s*band\.max_rating_diff/i,
  );
  assert.match(raceTargetLock, /band\.season_id\s*=\s*new\.season_id/i);
  assert.match(raceTargetLock, /new\.race_to_a\s*:=\s*rating_band\.(?:stronger|weaker)_race_to/i);
  assert.match(raceTargetLock, /new\.race_to_b\s*:=\s*rating_band\.(?:stronger|weaker)_race_to/i);
  assert.match(
    raceTargetLock,
    /Locked race target for player A calculated from the season race chart when the match row is created\./i,
  );
  assert.match(
    raceTargetLock,
    /Locked race target for player B calculated from the season race chart when the match row is created\./i,
  );
});

test('generated match creation does not accept client-supplied rating snapshots or race targets', () => {
  const insert = generatedMatches.match(
    /insert into public\.player_matches\s*\(([^)]*)\)\s*select/i,
  );
  assert.ok(insert, 'generated player-match insert is present');

  const generatedColumns = insert[1].toLowerCase();
  assert.doesNotMatch(generatedColumns, /fargo_rating|rating_status|race_to/);
});

test('browser roles remain read-only on generated player match rows', () => {
  assert.match(
    generatedMatches,
    /grant select on public\.player_matches, public\.team_match_forfeits to anon, authenticated;/i,
  );

  const browserMutationGrant = /grant\s+(?:all|(?:insert|update)(?:\s*\([^)]*\))?|delete)\b[^;]*\bon\s+(?:table\s+)?public\.player_matches\b[^;]*\bto\s+(?:anon|authenticated)\b/i;
  assert.doesNotMatch(
    allMigrationSql,
    browserMutationGrant,
    'no migration may grant browser roles direct mutation access to player_matches',
  );
});
