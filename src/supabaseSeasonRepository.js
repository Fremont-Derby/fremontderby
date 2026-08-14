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

function encodeFilterValue(value) {
  return encodeURIComponent(value);
}

export function createSupabaseSeasonRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }
  fetchImpl = withSupabaseSchema(fetchImpl, env);

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async listAdminSeasons({ actorUserId }) {
      const seasons = await requestJson(
        fetchImpl,
        `${supabaseUrl}/rest/v1/seasons?select=id,name,status,created_at&order=created_at.desc`,
        {
          method: 'GET',
          headers,
        },
      );

      if (seasons?.length) {
        await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/get_season_setup`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            actor_user_id: actorUserId,
            target_season_id: seasons[0].id,
          }),
        });
      }

      return seasons ?? [];
    },

    async getSeason(seasonId) {
      const url = `${supabaseUrl}/rest/v1/seasons?id=eq.${encodeFilterValue(seasonId)}&select=id,status,first_round_date,round_interval_days,default_table_numbers`;
      const rows = await requestJson(fetchImpl, url, {
        method: 'GET',
        headers,
      });

      return rows?.[0] ?? null;
    },

    async getSeasonSetup({ actorUserId, seasonId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/get_season_setup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_season_id: seasonId,
        }),
      });

      return Array.isArray(result) ? (result[0] ?? null) : result;
    },

    async saveSeasonSetup({
      actorUserId,
      seasonId,
      seasonName,
      leagueNight,
      firstRoundDate,
      rosterLockRound,
      openingBlockLength,
      individualMinMatches,
      roundIntervalDays,
      tableNumbers,
      raceChartVersion,
      playoffTeamCount,
      playoffAnchorTiebreaker,
    }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/configure_season_setup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_season_id: seasonId,
          configured_season_name: seasonName,
          configured_league_night: leagueNight,
          configured_first_round_date: firstRoundDate,
          configured_roster_lock_round: rosterLockRound,
          configured_opening_block_length: openingBlockLength,
          configured_individual_min_matches: individualMinMatches,
          configured_round_interval_days: roundIntervalDays,
          configured_table_numbers: tableNumbers,
          configured_race_chart_version: raceChartVersion,
          configured_playoff_team_count: playoffTeamCount,
          configured_playoff_anchor_tiebreaker: playoffAnchorTiebreaker,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async listSeasonTeams(seasonId, actorUserId) {
      return requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/list_publishable_season_teams`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_season_id: seasonId,
        }),
      });
    },

    async savePublishedSchedule(payload) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/publish_season_schedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_season_id: payload.seasonId,
          actor_user_id: payload.actorUserId,
          expected_previous_status: payload.previousStatus,
          rounds_payload: payload.rounds,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },
  };
}
