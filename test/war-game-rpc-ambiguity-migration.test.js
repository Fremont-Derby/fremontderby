import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811092000_reconcile_war_game_rpc_ambiguities.sql',
  import.meta.url,
);

const sql = await readFile(migrationUrl, 'utf8');

test('season registration uses named upsert constraints', () => {
  assert.match(sql, /on conflict on constraint season_players_season_id_player_id_key do update/i);
  assert.match(sql, /on conflict on constraint payment_status_pkey do nothing/i);
  assert.doesNotMatch(sql, /on conflict\s*\(\s*season_id\s*,\s*player_id\s*\)/i);
});

test('membership convergence qualifies output-name collisions', () => {
  assert.match(
    sql,
    /update private\.team_invitations[\s\S]*where private\.team_invitations\.season_id = request_row\.season_id[\s\S]*private\.team_invitations\.team_id = request_row\.team_id/i,
  );
  assert.match(
    sql,
    /update private\.team_membership_requests[\s\S]*where private\.team_membership_requests\.season_id = invitation\.season_id[\s\S]*private\.team_membership_requests\.team_id = invitation\.team_id/i,
  );
  assert.match(
    sql,
    /returning private\.team_invitations\.id into inserted_invitation_id/i,
  );
  assert.match(
    sql,
    /returning private\.team_membership_requests\.id into request_id/i,
  );
});

test('membership reconciliation preserves current team-slot and multi-team behavior', () => {
  assert.match(sql, /perform private\.expire_season_team_registration\(target_season_id\)/i);
  assert.match(sql, /from private\.season_team_slots sts/i);
  assert.match(sql, /Player is already an active member of this team/i);
  assert.doesNotMatch(sql, /Player already has an active team membership/i);
});

test('postseason insert qualifies player id and preserves 4-4-4-3 plus anchor rules', () => {
  assert.match(
    sql,
    /lineup\.ordinality::integer,\s+lineup\.player_id,\s+'roster'[\s\S]*from unnest\(lineup_player_ids\) with ordinality as lineup\(player_id, ordinality\)/i,
  );
  assert.match(sql, /Postseason lineup requires three players with 4\+ team matches and a fourth with 3\+/i);
  assert.match(sql, /Postseason anchor must be selected from the submitted lineup/i);
  assert.match(sql, /returning private\.team_lineups\.id into saved_lineup_id/i);
});

test('all corrected RPCs remain service-role only', () => {
  for (const signature of [
    'register_for_season\\(uuid, uuid, text\\)',
    'request_team_membership\\(uuid, uuid\\)',
    'respond_to_team_membership_request\\(uuid, uuid, text\\)',
    'invite_player_to_team\\(uuid, uuid, uuid\\)',
    'respond_to_team_invitation\\(uuid, uuid, text\\)',
    'submit_postseason_lineup\\(uuid, uuid, uuid, uuid\\[\\], uuid\\)',
  ]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${signature} from public, anon, authenticated`, 'i'));
    assert.match(sql, new RegExp(`grant execute on function public\\.${signature} to service_role`, 'i'));
  }
});
