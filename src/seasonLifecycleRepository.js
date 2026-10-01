import { stripTrailingSlashes } from './stripTrailingSlashes.js';

function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return stripTrailingSlashes(value);
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

async function callRpc(fetchImpl, url, headers, fn, body) {
  const response = await fetchImpl(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const result = await parseResponse(response);
  if (!response.ok) {
    const message = typeof result === 'string' ? result : result?.message || result?.error || 'Request failed';
    throw new Error(message);
  }
  return result;
}

export function createSeasonLifecycleRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const url = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  return {
    getLifecycleReadiness({ actorUserId, seasonId }) {
      return callRpc(fetchImpl, url, headers, 'get_season_lifecycle_readiness', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
      }).then((rows) => (Array.isArray(rows) ? rows[0] : rows));
    },
    cancelSeason({ actorUserId, seasonId, reason }) {
      return callRpc(fetchImpl, url, headers, 'cancel_season', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        cancel_reason: reason,
      }).then((rows) => (Array.isArray(rows) ? rows[0] : rows));
    },
    archiveSeason({ actorUserId, seasonId }) {
      return callRpc(fetchImpl, url, headers, 'archive_season', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
      }).then((rows) => (Array.isArray(rows) ? rows[0] : rows));
    },
    safeDeleteSeason({ actorUserId, seasonId }) {
      return callRpc(fetchImpl, url, headers, 'safe_delete_season', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
      }).then((rows) => (Array.isArray(rows) ? rows[0] : rows));
    },
  };
}
