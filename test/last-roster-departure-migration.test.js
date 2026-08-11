import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811091500_return_last_roster_departures_to_free_agent_pool.sql',
  import.meta.url,
);

const sql = await readFile(migrationUrl, 'utf8');

test('removing the final active team membership returns the player to free agent', () => {
  assert.match(
    sql,
    /if not exists \([\s\S]*active_tm\.season_id = membership\.season_id[\s\S]*active_tm\.player_id = membership\.player_id[\s\S]*active_tm\.ends_at is null[\s\S]*update public\.season_players sp[\s\S]*participation_type = 'free_agent'/i,
  );
});

test('remaining active memberships keep multi-team players rostered', () => {
  assert.match(sql, /if not exists \([\s\S]*from public\.team_memberships active_tm/i);
  assert.doesNotMatch(
    sql,
    /update public\.season_players[\s\S]{0,120}participation_type = 'free_agent'[\s\S]{0,220}where[^;]*target_membership_id/i,
  );
});

test('migration repairs active rostered players who have no active team', () => {
  assert.match(
    sql,
    /update public\.season_players sp[\s\S]*sp\.status = 'active'[\s\S]*sp\.participation_type = 'rostered'[\s\S]*not exists \([\s\S]*tm\.season_id = sp\.season_id[\s\S]*tm\.player_id = sp\.player_id[\s\S]*tm\.ends_at is null/i,
  );
});

test('membership removal records an audit event without rewriting history', () => {
  assert.match(sql, /insert into private\.audit_events/i);
  assert.match(sql, /'team\.remove_member'/i);
  assert.match(sql, /update public\.team_memberships[\s\S]*set ends_at = ended_at/i);
  assert.doesNotMatch(sql, /delete from public\.team_memberships/i);
  assert.doesNotMatch(sql, /update public\.player_matches/i);
});
