function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
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
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return body;
}

export function createAdminPlayersRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
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

  return {
    async listPlayers({ actorUserId }) {
      const rows = await rpc('list_admin_players', { actor_user_id: actorUserId });
      return Array.isArray(rows) ? rows.map((row) => ({
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
  };
}
