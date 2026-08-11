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
