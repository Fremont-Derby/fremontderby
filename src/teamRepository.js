function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function jsonHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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

export function createTeamRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async listOwnTeamManagement({ actorUserId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/get_own_team_management`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
        }),
      });
      const openSeasons = await requestJson(
        fetchImpl,
        `${supabaseUrl}/rest/v1/seasons?select=id,name,status,first_round_date&status=eq.registration&order=created_at.desc`,
        { method: 'GET', headers },
      );
      const players = await requestJson(
        fetchImpl,
        `${supabaseUrl}/rest/v1/players?select=id,display_name&order=display_name.asc`,
        { method: 'GET', headers },
      );

      const management = Array.isArray(result)
        ? (result[0] ?? { player_id: null, captain_teams: [], invitations: [] })
        : (result ?? { player_id: null, captain_teams: [], invitations: [] });

      return {
        ...management,
        open_seasons: Array.isArray(openSeasons) ? openSeasons : [],
        players: Array.isArray(players) ? players : [],
      };
    },

    async listOwnTeamTrades({ actorUserId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/get_own_team_trades`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
        }),
      });

      return Array.isArray(result)
        ? (result[0] ?? { player_id: null, trades: [] })
        : result;
    },

    async createTeamWithCaptain({ actorUserId, seasonId, teamName }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/create_team_with_captain`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_season_id: seasonId,
          team_name: teamName,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async invitePlayerToTeam({ actorUserId, teamId, playerId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/invite_player_to_team`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_team_id: teamId,
          target_player_id: playerId,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async proposeTeamTrade({
      actorUserId,
      teamId,
      offeredPlayerId,
      requestedTeamId,
      requestedPlayerId,
    }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/propose_team_trade`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          actor_team_id: teamId,
          offered_roster_player_id: offeredPlayerId,
          requested_roster_team_id: requestedTeamId,
          requested_roster_player_id: requestedPlayerId,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async adminProposeTeamTradeException({
      actorUserId,
      teamId,
      offeredPlayerId,
      requestedTeamId,
      requestedPlayerId,
    }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/admin_propose_team_trade_exception`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          actor_team_id: teamId,
          offered_roster_player_id: offeredPlayerId,
          requested_roster_team_id: requestedTeamId,
          requested_roster_player_id: requestedPlayerId,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async respondToTeamInvitation({ actorUserId, invitationId, response }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/respond_to_team_invitation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_invitation_id: invitationId,
          response_status: response,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async respondToTeamTradePlayer({ actorUserId, tradeId, response }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/respond_to_team_trade_player`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_trade_id: tradeId,
          response_status: response,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async approveTeamTradeCaptain({ actorUserId, tradeId, response }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/approve_team_trade_captain`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_trade_id: tradeId,
          response_status: response,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async cancelTeamInvitation({ actorUserId, invitationId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/cancel_team_invitation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_invitation_id: invitationId,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async removeTeamMember({ actorUserId, membershipId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/remove_team_member`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_membership_id: membershipId,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },
  };
}
