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
      const mapRegistrationRow = (season) => ({
        id: season.id,
        name: season.name,
        status: season.status,
        firstRoundDate: season.first_round_date ?? season.firstRoundDate ?? null,
        teamCount: season.team_count ?? season.teamCount ?? null,
        confirmedTeamCount: season.confirmed_team_count ?? season.confirmedTeamCount ?? null,
        teamCapacity: season.team_capacity ?? season.teamCapacity ?? null,
        occupiedSlots: season.occupied_slots ?? season.occupiedSlots ?? null,
        openTeamSlots: season.open_team_slots ?? season.openTeamSlots ?? null,
        reservedReturningSlots: season.reserved_returning_slots ?? season.reservedReturningSlots ?? null,
        heldTeamSlots: season.held_team_slots ?? season.heldTeamSlots ?? null,
        applicationsWaiting: season.applications_waiting ?? season.applicationsWaiting ?? null,
        rosteredPlayerCount: season.rostered_player_count ?? season.rosteredPlayerCount ?? null,
        registeredPlayerCount: season.registered_player_count ?? season.registeredPlayerCount ?? null,
        freeAgentCount: season.free_agent_count ?? season.freeAgentCount ?? null,
        openPrimaryRosterSpots: season.open_primary_roster_spots ?? season.openPrimaryRosterSpots ?? null,
        atRiskTeamCount: season.at_risk_team_count ?? season.atRiskTeamCount ?? null,
        minimumCommittedRoster: season.minimum_committed_roster ?? season.minimumCommittedRoster ?? null,
      });

      try {
        const seasons = await requestJson(
          fetchImpl,
          `${supabaseUrl}/rest/v1/rpc/list_public_season_registration`,
          { method: 'POST', headers, body: '{}' },
        );
        return (Array.isArray(seasons) ? seasons : []).map(mapRegistrationRow);
      } catch (error) {
        // Production has been observed with missing execute grants on this RPC.
        // Fall back to a minimal public seasons list so auth/session flows can load.
        const message = String(error?.message || '');
        const grantOrMissing =
          /permission denied|42501|PGRST202|Could not find the function|404/i.test(message);
        if (!grantOrMissing) throw error;

        const params = new URLSearchParams({
          select: 'id,name,status,first_round_date',
          order: 'created_at.desc',
        });
        const rows = await requestJson(
          fetchImpl,
          `${supabaseUrl}/rest/v1/seasons?${params}`,
          { method: 'GET', headers },
        );
        return (Array.isArray(rows) ? rows : []).map((season) => mapRegistrationRow({
          id: season.id,
          name: season.name,
          status: season.status,
          first_round_date: season.first_round_date,
        }));
      }
    },

    async listSeasonSchedule({ seasonId }) {
      const roundParams = new URLSearchParams({
        select: 'id,round_number,scheduled_on,status,stage,lineup_deadline_at',
        season_id: `eq.${seasonId}`,
        order: 'scheduled_on.asc,round_number.asc',
      });
      const matchParams = new URLSearchParams({
        select: 'id,round_id,team_a_id,team_b_id,table_number,status,makeup_on,makeup_location,makeup_status,makeup_note,makeup_proposed_by_team_id',
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
          teamAId: match.team_a_id,
          teamBId: match.team_b_id,
          teamAName: teamsById.get(match.team_a_id) ?? 'Team',
          teamBName: teamsById.get(match.team_b_id) ?? 'Team',
          tableNumber: match.table_number,
          status: match.status,
          makeupOn: match.makeup_on ?? null,
          makeupLocation: match.makeup_location ?? null,
          makeupStatus: match.makeup_status ?? null,
          makeupNote: match.makeup_note ?? null,
          makeupProposedByTeamId: match.makeup_proposed_by_team_id ?? null,
        });
        matchesByRoundId.set(match.round_id, matches);
      }
      return (Array.isArray(roundRows) ? roundRows : []).map((round) => ({
        roundId: round.id,
        roundNumber: round.round_number,
        scheduledOn: round.scheduled_on,
        status: round.status,
        stage: round.stage,
        lineupDeadlineAt: round.lineup_deadline_at ?? null,
        matches: matchesByRoundId.get(round.id) ?? [],
      }));
    },

    async seasonExists({ seasonId }) {
      // WHY: cheaper than listPublicSeasons (full registration RPC) just to 404-check.
      const params = new URLSearchParams({
        select: 'id',
        id: `eq.${seasonId}`,
        limit: '1',
      });
      const rows = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/seasons?${params}`, {
        method: 'GET',
        headers,
      });
      return Array.isArray(rows) && rows.length > 0;
    },

    async getSeasonScheduleVersion({ seasonId }) {
      const roundParams = new URLSearchParams({
        select: 'id,round_number,scheduled_on,status,stage',
        season_id: `eq.${seasonId}`,
        order: 'round_number.asc',
      });
      const matchParams = new URLSearchParams({
        select: 'id,round_id,status,table_number',
        season_id: `eq.${seasonId}`,
        order: 'id.asc',
      });
      const [roundRows, matchRows] = await Promise.all([
        requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rounds?${roundParams}`, { method: 'GET', headers }),
        requestJson(fetchImpl, `${supabaseUrl}/rest/v1/team_matches?${matchParams}`, { method: 'GET', headers }),
      ]);
      return {
        rounds: Array.isArray(roundRows) ? roundRows : [],
        matches: Array.isArray(matchRows) ? matchRows : [],
      };
    },

    async getSeasonStandingsVersion({ seasonId }) {
      // Standings move when match/round status changes; cheaper than full standings RPCs.
      const matchParams = new URLSearchParams({
        select: 'id,status',
        season_id: `eq.${seasonId}`,
        order: 'id.asc',
      });
      const roundParams = new URLSearchParams({
        select: 'id,status',
        season_id: `eq.${seasonId}`,
        order: 'id.asc',
      });
      const [matchRows, roundRows] = await Promise.all([
        requestJson(fetchImpl, `${supabaseUrl}/rest/v1/team_matches?${matchParams}`, { method: 'GET', headers }),
        requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rounds?${roundParams}`, { method: 'GET', headers }),
      ]);
      return {
        matches: Array.isArray(matchRows) ? matchRows : [],
        rounds: Array.isArray(roundRows) ? roundRows : [],
      };
    },

    async listTeamStandings({ seasonId }) {
      return requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/list_team_standings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_season_id: seasonId,
        }),
      });
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
