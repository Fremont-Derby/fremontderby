import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';
function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeSupabaseUrl(value) {
  return stripTrailingSlashes(value);
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

export function createAvailabilityRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }
  fetchImpl = withSupabaseSchema(fetchImpl, env);

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async setRosterAvailability({ actorUserId, roundId, availabilityStatus }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/set_roster_availability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_round_id: roundId,
          availability_status: availabilityStatus,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async listTeamRoundAvailability({ actorUserId, teamId, roundId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/list_team_round_availability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_team_id: teamId,
          target_round_id: roundId,
        }),
      });

      return Array.isArray(result) ? result : [];
    },
  };
}
