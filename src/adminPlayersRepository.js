import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';
function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return stripTrailingSlashes(value);
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function requestJson(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const body = await parseResponse(response);
  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.message;
    const error = new Error(
      `Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`,
    );
    error.status = response.status;
    throw error;
  }
  return body;
}

export function createAdminPlayersRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  const baseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };

  async function rpc(name, body) {
    return requestJson(fetchImpl, `${baseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
  }

  function normalizePlayer(row) {
    return {
      playerId: row.player_id,
      displayName: row.display_name,
      hasLogin: Boolean(row.has_login),
      isLeagueAdmin: Boolean(row.is_league_admin),
      teams: Array.isArray(row.teams) ? row.teams : [],
      currentSeasonId: row.current_season_id ?? null,
      currentSeasonName: row.current_season_name ?? null,
      registrationStatus: row.registration_status ?? null,
      paymentStatus: row.payment_status ?? null,
      competitionEligible: row.competition_eligible !== false,
      ineligibilityReason: row.ineligibility_reason ?? null,
    };
  }

  return {
    async listPlayers({ actorUserId }) {
      let rows;
      try {
        rows = await rpc('list_admin_players_for_management', {
          actor_user_id: actorUserId,
        });
      } catch (error) {
        if (error.status !== 404) throw error;
        rows = await rpc('list_admin_players', { actor_user_id: actorUserId });
      }
      return Array.isArray(rows) ? rows.map(normalizePlayer) : [];
    },

    async createPlayer({ actorUserId, displayName, allowExactDuplicate = false }) {
      const rows = await rpc('admin_create_unclaimed_player', {
        actor_user_id: actorUserId,
        target_display_name: displayName,
        allow_exact_duplicate: allowExactDuplicate,
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      return {
        playerId: row?.player_id ?? null,
        displayName: row?.display_name ?? displayName,
        hasLogin: Boolean(row?.has_login),
      };
    },

    async listRosterTeams({ actorUserId }) {
      const rows = await rpc('list_admin_roster_teams', {
        actor_user_id: actorUserId,
      });
      return Array.isArray(rows) ? rows.map((row) => ({
        seasonId: row.season_id,
        seasonName: row.season_name,
        teamId: row.team_id,
        teamName: row.team_name,
      })) : [];
    },

    async setAdminRole({ actorUserId, playerId, enabled, reason = null }) {
      const rows = await rpc('set_league_admin_role', {
        actor_user_id: actorUserId,
        target_player_id: playerId,
        enabled,
        change_reason: reason,
      });
      const row = Array.isArray(rows) ? rows[0] : null;
      return {
        playerId: row?.player_id ?? playerId,
        isLeagueAdmin: Boolean(row?.is_league_admin ?? enabled),
      };
    },

    async setCompetitionEligibility({
      actorUserId,
      playerId,
      seasonId,
      eligible,
      reason = null,
    }) {
      const rows = await rpc('set_player_competition_eligibility', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        target_player_id: playerId,
        eligible,
        change_reason: reason,
      });
      const row = Array.isArray(rows) ? rows[0] : null;
      return {
        playerId: row?.player_id ?? playerId,
        seasonId: row?.season_id ?? seasonId,
        competitionEligible: Boolean(row?.competition_eligible ?? eligible),
        ineligibilityReason: row?.ineligibility_reason ?? null,
      };
    },

    async setRosterMembership({
      actorUserId,
      playerId,
      seasonId,
      teamId,
      active,
      reason = null,
    }) {
      const rows = await rpc('set_admin_player_team_membership', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        target_team_id: teamId,
        target_player_id: playerId,
        active,
        change_reason: reason,
      });
      const row = Array.isArray(rows) ? rows[0] : null;
      return {
        membershipId: row?.membership_id ?? null,
        seasonId: row?.season_id ?? seasonId,
        teamId: row?.team_id ?? teamId,
        playerId: row?.player_id ?? playerId,
        role: row?.role ?? 'player',
        endsAt: row?.ends_at ?? null,
      };
    },
  };
}
