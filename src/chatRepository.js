function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
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

async function requestRpc(fetchImpl, url, headers, body) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const result = await parseResponse(response);
  if (!response.ok) {
    const message = typeof result === 'string' ? result : result?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return result;
}

export function createChatRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');

  const baseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
  const rpc = (name, body) => requestRpc(
    fetchImpl,
    `${baseUrl}/rest/v1/rpc/${name}`,
    headers,
    body,
  );

  return {
    async listChatThreads({ actorUserId }) {
      return rpc('get_my_team_chat_inbox', { actor_user_id: actorUserId });
    },

    async listTeamMessages({ actorUserId, teamId, before, limit }) {
      return rpc('list_team_chat_messages', {
        actor_user_id: actorUserId,
        target_team_id: teamId,
        before_created_at: before,
        result_limit: limit,
      });
    },

    async sendTeamMessage({ actorUserId, teamId, body, clientMessageId }) {
      const result = await rpc('send_team_chat_message', {
        actor_user_id: actorUserId,
        target_team_id: teamId,
        message_body: body,
        message_client_id: clientMessageId,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async markTeamChatRead({ actorUserId, teamId, readAt }) {
      const result = await rpc('mark_team_chat_read', {
        actor_user_id: actorUserId,
        target_team_id: teamId,
        read_through_at: readAt,
      });
      return Array.isArray(result) ? result[0] : result;
    },
  };
}
