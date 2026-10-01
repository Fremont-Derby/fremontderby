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

export function createTeamMatchChoiceRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async listMyTeamMatchChoices({ actorUserId }) {
      const rows = await requestJson(
        fetchImpl,
        `${supabaseUrl}/rest/v1/rpc/list_my_team_match_choices`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ actor_user_id: actorUserId }),
        },
      );
      return Array.isArray(rows) ? rows : [];
    },

    async chooseTeamMatchTeam({ actorUserId, teamMatchId, teamId }) {
      const row = await requestJson(
        fetchImpl,
        `${supabaseUrl}/rest/v1/rpc/choose_team_match_team`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            actor_user_id: actorUserId,
            target_team_match_id: teamMatchId,
            target_team_id: teamId,
          }),
        },
      );
      return Array.isArray(row) ? row[0] : row;
    },
  };
}
