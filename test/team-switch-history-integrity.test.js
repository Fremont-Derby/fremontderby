import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readMigration(name) {
  return readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
}

test('membership changes keep time-bounded history and allow rejoining a team later', async () => {
  const identity = await readMigration('20260809235600_identity_and_rosters.sql');
  const multiTeam = await readMigration('20260811114500_allow_multi_team_memberships.sql');
  const adminRoster = await readMigration('20260811230000_admin_player_roster_exceptions.sql');

  assert.match(identity, /starts_at timestamptz not null default now/);
  assert.match(identity, /ends_at timestamptz/);
  assert.match(identity, /Membership history is time-bounded/);
  assert.match(multiTeam, /one_active_team_membership_per_team/);
  assert.match(multiTeam, /season_id, team_id, player_id/);
  assert.match(multiTeam, /where ends_at is null/);
  assert.match(adminRoster, /set ends_at = now/);
  assert.match(adminRoster, /insert into public\.team_memberships/);
});

test('generated matches snapshot the team side where each player actually played', async () => {
  const generated = await readMigration('20260810050000_generate_player_matches.sql');

  assert.match(generated, /team_a_id uuid not null/);
  assert.match(generated, /team_b_id uuid not null/);
  assert.match(generated, /target_match\.team_a_id/);
  assert.match(generated, /target_match\.team_b_id/);
  assert.match(generated, /a_slots\.player_id/);
  assert.match(generated, /b_slots\.player_id/);
});

test('team standings credit stored match sides instead of current membership', async () => {
  const standings = await readMigration('20260810083000_team_standings.sql');

  assert.match(standings, /pm\.team_a_id as team_id/);
  assert.match(standings, /pm\.team_b_id as team_id/);
  assert.doesNotMatch(standings, /team_memberships/);
});

test('postseason team qualification counts historical appearances on the stored match team', async () => {
  const postseason = await readMigration('20260811042000_postseason_lineups_and_anchor_tiebreakers.sql');
  const countsStart = postseason.indexOf('with player_counts as (');
  const countsEnd = postseason.indexOf('from player_counts;', countsStart);
  assert.ok(countsStart >= 0 && countsEnd > countsStart);
  const playerCounts = postseason.slice(countsStart, countsEnd);

  assert.match(playerCounts, /pm\.team_a_id = target_team_id and pm\.player_a_id = pid\.player_id/);
  assert.match(playerCounts, /pm\.team_b_id = target_team_id and pm\.player_b_id = pid\.player_id/);
  assert.doesNotMatch(playerCounts, /team_memberships/);
});
