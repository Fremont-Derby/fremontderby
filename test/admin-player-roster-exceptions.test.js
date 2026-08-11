import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createAdminPlayersRepository } from '../src/adminPlayersRepository.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

const migrationPath = new URL(
  '../supabase/migrations/20260811230000_admin_player_roster_exceptions.sql',
  import.meta.url,
);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('admin roster exception preserves history, unrelated memberships, and captain lifecycle', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /'membershipId', tm\.id/);
  assert.match(sql, /create or replace function public\.list_admin_roster_teams/);
  assert.match(sql, /create or replace function public\.set_admin_player_team_membership/);
  assert.match(sql, /tm\.season_id = target_season_id/);
  assert.match(sql, /tm\.team_id = target_team_id/);
  assert.match(sql, /tm\.player_id = target_player_id/);
  assert.match(sql, /insert into public\.team_memberships\(season_id, team_id, player_id, role\)/);
  assert.match(sql, /set ends_at = now\(\)/);
  assert.match(sql, /where tm\.id = membership\.id/);
  assert.match(sql, /Captain memberships require the captain lifecycle workflow/);
  assert.match(sql, /player\.admin_add_team_membership/);
  assert.match(sql, /player\.admin_remove_team_membership/);
  assert.match(sql, /revoke all on function public\.set_admin_player_team_membership/);
  assert.match(sql, /grant execute on function public\.set_admin_player_team_membership[^;]+to service_role/s);
});

test('admin player repository uses human-readable team list and service-role membership mutation', async () => {
  const calls = [];
  const repository = createAdminPlayersRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
    },
    {
      fetch: async (url, init) => {
        calls.push({ url, init });
        if (url.endsWith('/rpc/list_admin_roster_teams')) {
          return jsonResponse([{
            season_id: 'season-1',
            season_name: 'Season 1',
            team_id: 'team-2',
            team_name: 'Second Team',
          }]);
        }
        return jsonResponse([{
          membership_id: 'membership-2',
          season_id: 'season-1',
          team_id: 'team-2',
          player_id: 'player-1',
          role: 'player',
          ends_at: null,
        }]);
      },
    },
  );

  const [team] = await repository.listRosterTeams({ actorUserId: 'admin-user' });
  assert.deepEqual(team, {
    seasonId: 'season-1',
    seasonName: 'Season 1',
    teamId: 'team-2',
    teamName: 'Second Team',
  });

  const membership = await repository.setRosterMembership({
    actorUserId: 'admin-user',
    playerId: 'player-1',
    seasonId: 'season-1',
    teamId: 'team-2',
    active: true,
    reason: 'League exception',
  });
  assert.equal(membership.membershipId, 'membership-2');
  assert.match(calls[1].url, /set_admin_player_team_membership$/);
  assert.equal(calls[1].init.headers.authorization, 'Bearer service-secret');
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: 'admin-user',
    target_season_id: 'season-1',
    target_team_id: 'team-2',
    target_player_id: 'player-1',
    active: true,
    change_reason: 'League exception',
  });
});

test('player management UI adds and removes one team without exposing identifiers', () => {
  const html = renderAdminPlayersPage();

  assert.match(html, /team membership exceptions without IDs or database edits/);
  assert.match(html, /Add to team/);
  assert.match(html, /Remove from team/);
  assert.match(html, /Roster exception note \(optional\)/);
  assert.match(html, /operation:'roster-membership'/);
  assert.match(html, /team\.membershipId&&team\.role==='player'/);
  assert.match(html, /team\.seasonId===player\.currentSeasonId/);
  assert.match(html, /No other active-season teams/);
  assert.match(html, /@media\(max-width:640px\)/);
});
