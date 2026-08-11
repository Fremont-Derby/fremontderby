import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createAdminPlayersRepository } from '../src/adminPlayersRepository.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

const migrationPath = new URL(
  '../supabase/migrations/20260811224500_player_competition_eligibility.sql',
  import.meta.url,
);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('competition restrictions are private, audited, season-scoped, and enforced at database write boundaries', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /create table private\.player_competition_restrictions/);
  assert.match(sql, /season_id uuid not null/);
  assert.match(sql, /lifted_at timestamptz/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on private\.player_competition_restrictions from public, anon, authenticated/);
  assert.match(sql, /A reason is required to mark a player ineligible/);
  assert.match(sql, /player\.mark_competition_ineligible/);
  assert.match(sql, /player\.restore_competition_eligibility/);
  assert.match(sql, /team_lineup_slots_competition_eligibility/);
  assert.match(sql, /team_score_submissions_competition_eligibility/);
  assert.match(sql, /legacy_match_racks_competition_eligibility/);
  assert.match(sql, /new_rack_count <= old_rack_count then return new/);
  assert.match(sql, /Player is marked ineligible for competition/);
});

test('admin player repository exposes current-season readiness and writes eligibility through service-role RPC', async () => {
  const calls = [];
  const repository = createAdminPlayersRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
    },
    {
      fetch: async (url, init) => {
        calls.push({ url, init });
        if (url.endsWith('/rpc/list_admin_players')) {
          return jsonResponse([{
            player_id: 'player-1',
            display_name: 'Alex Example',
            has_login: true,
            is_league_admin: false,
            teams: [],
            current_season_id: 'season-1',
            current_season_name: 'Season 1',
            registration_status: 'active',
            payment_status: 'waived',
            competition_eligible: false,
            ineligibility_reason: 'League review',
          }]);
        }
        return jsonResponse([{
          player_id: 'player-1',
          season_id: 'season-1',
          competition_eligible: true,
          ineligibility_reason: null,
        }]);
      },
    },
  );

  const [player] = await repository.listPlayers({ actorUserId: 'admin-user' });
  assert.equal(player.currentSeasonName, 'Season 1');
  assert.equal(player.paymentStatus, 'waived');
  assert.equal(player.competitionEligible, false);
  assert.equal(player.ineligibilityReason, 'League review');

  const result = await repository.setCompetitionEligibility({
    actorUserId: 'admin-user',
    playerId: 'player-1',
    seasonId: 'season-1',
    eligible: true,
    reason: 'Review complete',
  });
  assert.equal(result.competitionEligible, true);
  assert.match(calls[1].url, /set_player_competition_eligibility$/);
  assert.equal(calls[1].init.headers.authorization, 'Bearer service-secret');
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: 'admin-user',
    target_season_id: 'season-1',
    target_player_id: 'player-1',
    eligible: true,
    change_reason: 'Review complete',
  });
});

test('player management UI requires an ineligibility reason and explains gameplay effect', () => {
  const html = renderAdminPlayersPage();
  assert.match(html, /Mark ineligible/);
  assert.match(html, /Restore eligibility/);
  assert.match(html, /Reason required to mark ineligible/);
  assert.match(html, /blocked from new lineup\/scoring activity/);
  assert.match(html, /Registration/);
  assert.match(html, /Payment/);
  assert.match(html, /operation:'competition-eligibility'/);
  assert.match(html, /reason\.focus\(\)/);
});
