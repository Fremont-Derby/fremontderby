import { withSupabaseSchema } from './supabaseSchema.js';
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

async function loadLineupRoundsForTeam(
  fetchImpl,
  supabaseUrl,
  headers,
  { seasonId, teamId },
) {
  const matchParams = new URLSearchParams({
    select: 'id,round_id,team_a_id,team_b_id,table_number,status',
    season_id: `eq.${seasonId}`,
    or: `(team_a_id.eq.${teamId},team_b_id.eq.${teamId})`,
  });
  const roundParams = new URLSearchParams({
    select: 'id,round_number,scheduled_on,status,stage,lineup_deadline_at',
    season_id: `eq.${seasonId}`,
    stage: 'eq.regular',
    order: 'round_number.asc',
  });
  const teamParams = new URLSearchParams({
    select: 'id,name',
    season_id: `eq.${seasonId}`,
  });

  const [teamMatches, rounds, teams] = await Promise.all([
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/team_matches?${matchParams}`,
      { method: 'GET', headers },
    ),
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/rounds?${roundParams}`,
      { method: 'GET', headers },
    ),
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/teams?${teamParams}`,
      { method: 'GET', headers },
    ),
  ]);

  const matchByRoundId = new Map(
    (Array.isArray(teamMatches) ? teamMatches : []).map((match) => [match.round_id, match]),
  );
  const teamById = new Map(
    (Array.isArray(teams) ? teams : []).map((team) => [team.id, team]),
  );

  return (Array.isArray(rounds) ? rounds : [])
    .filter((round) => matchByRoundId.has(round.id))
    .map((round) => {
      const match = matchByRoundId.get(round.id);
      const opponentTeamId = match.team_a_id === teamId
        ? match.team_b_id
        : match.team_a_id;
      return {
        roundId: round.id,
        roundNumber: round.round_number,
        scheduledOn: round.scheduled_on,
        roundStatus: round.status,
        lineupDeadlineAt: round.lineup_deadline_at,
        teamMatchId: match.id,
        opponentName: teamById.get(opponentTeamId)?.name ?? 'Opponent',
        tableNumber: match.table_number,
        teamMatchStatus: match.status,
      };
    });
}

function inFilter(values) {
  return `in.(${values.join(',')})`;
}

async function loadAvailabilityContexts(
  fetchImpl,
  supabaseUrl,
  headers,
  playerId,
) {
  if (!playerId) return [];

  const encodedPlayerId = encodeURIComponent(playerId);
  const [memberships, seasonPlayers] = await Promise.all([
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/team_memberships?select=season_id,team_id,role&player_id=eq.${encodedPlayerId}&ends_at=is.null`,
      { method: 'GET', headers },
    ),
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/season_players?select=season_id,participation_type,status&player_id=eq.${encodedPlayerId}&status=eq.active`,
      { method: 'GET', headers },
    ),
  ]);

  const activeMemberships = Array.isArray(memberships) ? memberships : [];
  const activeSeasonPlayers = Array.isArray(seasonPlayers) ? seasonPlayers : [];
  const seasonIds = [...new Set([
    ...activeMemberships.map((row) => row.season_id),
    ...activeSeasonPlayers.map((row) => row.season_id),
  ].filter(Boolean))];
  if (!seasonIds.length) return [];

  const seasonFilter = inFilter(seasonIds);
  const [seasons, teams, rounds, teamMatches] = await Promise.all([
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/seasons?select=id,name,status&id=${seasonFilter}`,
      { method: 'GET', headers },
    ),
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/teams?select=id,season_id,name&season_id=${seasonFilter}`,
      { method: 'GET', headers },
    ),
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/rounds?select=id,season_id,round_number,scheduled_on,status,stage&season_id=${seasonFilter}&stage=eq.regular&order=scheduled_on.asc,round_number.asc`,
      { method: 'GET', headers },
    ),
    requestJson(
      fetchImpl,
      `${supabaseUrl}/rest/v1/team_matches?select=id,season_id,round_id,team_a_id,team_b_id,table_number,status&season_id=${seasonFilter}`,
      { method: 'GET', headers },
    ),
  ]);

  const seasonById = new Map(
    (Array.isArray(seasons) ? seasons : []).map((season) => [season.id, season]),
  );
  const teamById = new Map(
    (Array.isArray(teams) ? teams : []).map((team) => [team.id, team]),
  );
  const regularRounds = Array.isArray(rounds) ? rounds : [];
  const matches = Array.isArray(teamMatches) ? teamMatches : [];
  const rosterSeasonIds = new Set(activeMemberships.map((row) => row.season_id));
  const contexts = [];

  for (const membership of activeMemberships) {
    const team = teamById.get(membership.team_id);
    const season = seasonById.get(membership.season_id);
    for (const round of regularRounds.filter((row) => row.season_id === membership.season_id)) {
      const match = matches.find((row) => row.round_id === round.id
        && (row.team_a_id === membership.team_id || row.team_b_id === membership.team_id));
      if (!match) continue;
      contexts.push({
        seasonId: membership.season_id,
        seasonName: season?.name ?? 'Season',
        participationType: 'roster',
        teamId: membership.team_id,
        teamName: team?.name ?? 'Team',
        roundId: round.id,
        roundNumber: round.round_number,
        scheduledOn: round.scheduled_on,
        roundStatus: round.status,
        tableNumber: match.table_number,
        teamMatchStatus: match.status,
      });
    }
  }

  for (const seasonPlayer of activeSeasonPlayers) {
    if (seasonPlayer.participation_type !== 'free_agent') continue;
    if (rosterSeasonIds.has(seasonPlayer.season_id)) continue;
    const season = seasonById.get(seasonPlayer.season_id);
    for (const round of regularRounds.filter((row) => row.season_id === seasonPlayer.season_id)) {
      contexts.push({
        seasonId: seasonPlayer.season_id,
        seasonName: season?.name ?? 'Season',
        participationType: 'free_agent',
        teamId: null,
        teamName: null,
        roundId: round.id,
        roundNumber: round.round_number,
        scheduledOn: round.scheduled_on,
        roundStatus: round.status,
        tableNumber: null,
        teamMatchStatus: null,
      });
    }
  }

  return contexts.sort((left, right) => {
    const leftDate = left.scheduledOn ?? '9999-12-31';
    const rightDate = right.scheduledOn ?? '9999-12-31';
    return leftDate.localeCompare(rightDate)
      || Number(left.roundNumber) - Number(right.roundNumber)
      || left.participationType.localeCompare(right.participationType);
  });
}

export function createTeamRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }
  fetchImpl = withSupabaseSchema(fetchImpl, env);

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

      const management = Array.isArray(result)
        ? (result[0] ?? { player_id: null, captain_teams: [], invitations: [] })
        : (result ?? { player_id: null, captain_teams: [], invitations: [] });

      let enrichedManagement = management;
      try {
        const openSeasons = await requestJson(
          fetchImpl,
          `${supabaseUrl}/rest/v1/seasons?select=id,name,status,first_round_date&status=eq.registration&order=created_at.desc`,
          { method: 'GET', headers },
        );
        const players = await requestJson(
          fetchImpl,
          `${supabaseUrl}/rest/v1/players?select=id,display_name,active_memberships:team_memberships!left(season_id)&active_memberships.ends_at=is.null&order=display_name.asc`,
          { method: 'GET', headers },
        );

        enrichedManagement = {
          ...management,
          open_seasons: Array.isArray(openSeasons) ? openSeasons : [],
          players: Array.isArray(players) ? players.map((player) => {
            const activeSeasonIds = [...new Set(
              (Array.isArray(player.active_memberships) ? player.active_memberships : [])
                .map((membership) => membership?.season_id)
                .filter(Boolean),
            )];
            const directoryPlayer = { ...player };
            delete directoryPlayer.active_memberships;
            return { ...directoryPlayer, activeSeasonIds };
          }) : [],
        };
      } catch {
        // Team management remains useful even if optional picker data is unavailable.
      }

      const captainTeams = enrichedManagement.captain_teams ?? [];
      let scheduleEnriched = false;
      const teamsWithRounds = [];
      for (const team of captainTeams) {
        try {
          const lineupRounds = await loadLineupRoundsForTeam(
            fetchImpl,
            supabaseUrl,
            headers,
            team,
          );
          teamsWithRounds.push({ ...team, lineupRounds });
          scheduleEnriched = true;
        } catch {
          teamsWithRounds.push(team);
        }
      }

      let finalManagement = scheduleEnriched
        ? { ...enrichedManagement, captain_teams: teamsWithRounds }
        : enrichedManagement;

      try {
        const availabilityContexts = await loadAvailabilityContexts(
          fetchImpl,
          supabaseUrl,
          headers,
          management.player_id,
        );
        finalManagement = {
          ...finalManagement,
          availability_contexts: availabilityContexts,
        };
      } catch {
        // Availability selection is optional enrichment of the base management view.
      }

      return finalManagement;
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
