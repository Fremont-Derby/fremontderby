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
      const [seasons, teams, memberships] = await Promise.all([
        requestJson(
          fetchImpl,
          `${supabaseUrl}/rest/v1/seasons?select=id,name,status,first_round_date,created_at&order=created_at.desc`,
          { method: 'GET', headers },
        ),
        requestJson(
          fetchImpl,
          `${supabaseUrl}/rest/v1/teams?select=id,season_id`,
          { method: 'GET', headers },
        ),
        requestJson(
          fetchImpl,
          `${supabaseUrl}/rest/v1/team_memberships?select=season_id,player_id&ends_at=is.null`,
          { method: 'GET', headers },
        ),
      ]);

      const teamCounts = new Map();
      for (const team of Array.isArray(teams) ? teams : []) {
        teamCounts.set(team.season_id, (teamCounts.get(team.season_id) ?? 0) + 1);
      }

      const playersBySeason = new Map();
      for (const membership of Array.isArray(memberships) ? memberships : []) {
        if (!playersBySeason.has(membership.season_id)) {
          playersBySeason.set(membership.season_id, new Set());
        }
        playersBySeason.get(membership.season_id).add(membership.player_id);
      }

      const teamCapacity = 8;
      return (Array.isArray(seasons) ? seasons : []).map((season) => {
        const teamCount = teamCounts.get(season.id) ?? 0;
        return {
          id: season.id,
          name: season.name,
          status: season.status,
          firstRoundDate: season.first_round_date,
          teamCount,
          teamCapacity,
          openTeamSlots: Math.max(0, teamCapacity - teamCount),
          rosteredPlayerCount: playersBySeason.get(season.id)?.size ?? 0,
        };
      });
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
