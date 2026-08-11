import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function migration(name) {
  return readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
}

test('team slot capacity decisions serialize the final available slot', () => {
  const sql = migration('20260811072523_season_team_slots_and_applications.sql');
  assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\(/);
  assert.match(sql, /if occupied_slots >= target_capacity then/);
  assert.match(sql, /No team slots are currently available/);
  assert.match(sql, /status in \('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed'\)/);
});

test('committed roster readiness requires active season registration', () => {
  const sql = migration('20260811073221_enforce_registered_team_readiness.sql');
  assert.match(sql, /join public\.season_players sp/);
  assert.match(sql, /sp\.status = 'active'/);
  assert.match(sql, /enforce_viable_teams_before_season_publication/);
  assert.match(sql, /Team must meet the minimum committed roster before confirmation/);
});

test('accepted registration rosters activate season players safely', () => {
  const sql = migration('20260811073456_auto_register_rostered_members.sql');
  assert.match(sql, /create trigger auto_register_rostered_member/);
  assert.match(sql, /on conflict on constraint season_players_season_id_player_id_key/);
  assert.match(sql, /participation_type = 'rostered', status = 'active'/);
});
