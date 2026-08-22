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

async function addCaptainContext(fetchImpl, supabaseUrl, headers, seasonId, standings) {
  const rows = Array.isArray(standings) ? standings : [];
  const teamIds = [...new Set(rows.map((row) => row?.team_id).filter(Boolean))];
  if (!teamIds.length) return rows;

  const membershipParams = new URLSearchParams({
    select: 'team_id,player_id',
    season_id: `eq.${seasonId}`,
    team_id: `in.(${teamIds.join(',')})`,
    role: 'eq.captain',
    ends_at: 'is.null',
  });
  const memberships = await requestJson(
    fetchImpl,
    `${supabaseUrl}/rest/v1/team_memberships?${membershipParams}`,
    { method: 'GET', headers },
  );
  const activeCaptains = Array.isArray(memberships) ? memberships : [];
  const playerIds = [...new Set(activeCaptains.map((row) => row?.player_id).filter(Boolean))];
  if (!playerIds.length) return rows;

  const playerParams = new URLSearchParams({
    select: 'id,display_name',
    id: `in.(${playerIds.join(',')})`,
  });
  const players = await requestJson(
    fetchImpl,
    `${supabaseUrl}/rest/v1/players?${playerParams}`,
    { method: 'GET', headers },
  );
  const displayNameByPlayerId = new Map(
    (Array.isArray(players) ? players : []).map((player) => [player.id, player.display_name]),
  );
  const captainNameByTeamId = new Map(
    activeCaptains.map((membership) => [
      membership.team_id,
      displayNameByPlayerId.get(membership.player_id) ?? null,
    ]),
  );

  return rows.map((row) => ({
    ...row,
    captain_display_name: captainNameByTeamId.get(row.team_id) ?? null,
  }));
}

export function createStandingsRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }
  fetchImpl = withSupabaseSchema(fetchImpl, env);

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async listPublicSeasons() {
      const seasons = await requestJson(
        fetchImpl,
        `${supabaseUrl}/rest/v1/rpc/list_public_season_registration`,
        { method: 'POST', headers, body: '{}' },
      );
      return (Array.isArray(seasons) ? seasons : []).map((season) => ({
        id: season.id,
        name: season.name,
        status: season.status,
        firstRoundDate: season.first_round_date,
        teamCount: season.team_count,
        confirmedTeamCount: season.confirmed_team_count,
        teamCapacity: season.team_capacity,
        occupiedSlots: season.occupied_slots,
        openTeamSlots: season.open_team_slots,
        reservedReturningSlots: season.reserved_returning_slots,
        heldTeamSlots: season.held_team_slots,
        applicationsWaiting: season.applications_waiting,
        rosteredPlayerCount: season.rostered_player_count,
        registeredPlayerCount: season.registered_player_count,
        freeAgentCount: season.free_agent_count,
        openPrimaryRosterSpots: season.open_primary_roster_spots,
        atRiskTeamCount: season.at_risk_team_count,
        minimumCommittedRoster: season.minimum_committed_roster,
      }));
    },

    async listSeasonSchedule({ seasonId }) {
      const roundParams = new URLSearchParams({
        select: 'id,round_number,scheduled_on,status,stage',
        season_id: `eq.${seasonId}`,
        order: 'scheduled_on.asc,round_number.asc',
      });
      const matchParams = new URLSearchParams({
        select: 'id,round_id,team_a_id,team_b_id,table_number,status',
        season_id: `eq.${seasonId}`,
        order: 'round_id.asc,table_number.asc',
      });
      const teamParams = new URLSearchParams({
        select: 'id,name',
        season_id: `eq.${seasonId}`,
        order: 'name.asc',
      });
      const [roundRows, matchRows, teamRows] = await Promise.all([
        requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rounds?${roundParams}`, {
          method: 'GET',
          headers,
        }),
        requestJson(fetchImpl, `${supabaseUrl}/rest/v1/team_matches?${matchParams}`, {
          method: 'GET',
          headers,
        }),
        requestJson(fetchImpl, `${supabaseUrl}/rest/v1/teams?${teamParams}`, {
          method: 'GET',
          headers,
        }),
      ]);
      const teamsById = new Map(
        (Array.isArray(teamRows) ? teamRows : []).map((team) => [team.id, team.name]),
      );
      const matchesByRoundId = new Map();
      for (const match of Array.isArray(matchRows) ? matchRows : []) {
        const matches = matchesByRoundId.get(match.round_id) ?? [];
        matches.push({
          teamMatchId: match.id,
          teamAName: teamsById.get(match.team_a_id) ?? 'Team',
          teamBName: teamsById.get(match.team_b_id) ?? 'Team',
          tableNumber: match.table_number,
          status: match.status,
        });
        matchesByRoundId.set(match.round_id, matches);
      }
      return (Array.isArray(roundRows) ? roundRows : []).map((round) => ({
        roundId: round.id,
        roundNumber: round.round_number,
        scheduledOn: round.scheduled_on,
        status: round.status,
        stage: round.stage,
        matches: matchesByRoundId.get(round.id) ?? [],
      }));
    },

    async listTeamStandings({ seasonId }) {
      const standings = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/list_team_standings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_season_id: seasonId,
        }),
      });
      try {
        return await addCaptainContext(
          fetchImpl,
          supabaseUrl,
          headers,
          seasonId,
          standings,
        );
      } catch {
        // Standings remain available if optional public captain context cannot be enriched.
        return standings;
      }
    },

    async listIndividualStandings({ seasonId }) {
      return requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/list_individual_standings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_season_id: seasonId,
        }),
      });
    },
  };
}
