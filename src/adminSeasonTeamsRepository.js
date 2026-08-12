function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function headersFor(serviceRoleKey) {
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
  try { return JSON.parse(text); } catch { return text; }
}

async function rpc(fetchImpl, url, headers, name, body) {
  const response = await fetchImpl(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return payload;
}

export function createAdminSeasonTeamsRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const url = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = headersFor(serviceRoleKey);

  return {
    async list({ actorUserId, seasonId }) {
      const [registrationPayload, candidatesPayload] = await Promise.all([
        rpc(fetchImpl, url, headers, 'get_admin_season_registration', {
          actor_user_id: actorUserId,
          target_season_id: seasonId,
        }),
        rpc(fetchImpl, url, headers, 'list_admin_season_team_candidates', {
          actor_user_id: actorUserId,
          target_season_id: seasonId,
        }),
      ]);
      const registrationRow = Array.isArray(registrationPayload)
        ? registrationPayload[0]
        : registrationPayload;
      return {
        registration: registrationRow?.registration ?? registrationRow ?? null,
        teams: Array.isArray(candidatesPayload) ? candidatesPayload : [],
      };
    },

    async createPrepared({ actorUserId, seasonId, teamName }) {
      const payload = await rpc(fetchImpl, url, headers, 'admin_create_prepared_team', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        team_name: teamName,
      });
      return Array.isArray(payload) ? payload[0] : payload;
    },

    async add({ actorUserId, seasonId, teamId }) {
      const payload = await rpc(fetchImpl, url, headers, 'admin_add_team_to_season', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        candidate_team_id: teamId,
      });
      return Array.isArray(payload) ? payload[0] : payload;
    },
  };
}
