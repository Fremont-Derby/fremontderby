function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function headers(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
}

async function requestRpc(fetchImpl, supabaseUrl, serviceRoleKey, rpcName, body) {
  const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    headers: headers(serviceRoleKey),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }

  return Array.isArray(payload) ? payload[0] : payload;
}

export function createTeamMembershipRequestRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');

  return {
    listOwn({ actorUserId }) {
      return requestRpc(
        fetchImpl,
        supabaseUrl,
        serviceRoleKey,
        'get_own_team_membership_requests',
        { actor_user_id: actorUserId },
      );
    },

    requestJoin({ actorUserId, teamId }) {
      return requestRpc(
        fetchImpl,
        supabaseUrl,
        serviceRoleKey,
        'request_team_membership',
        { actor_user_id: actorUserId, target_team_id: teamId },
      );
    },

    respond({ actorUserId, requestId, response }) {
      return requestRpc(
        fetchImpl,
        supabaseUrl,
        serviceRoleKey,
        'respond_to_team_membership_request',
        {
          actor_user_id: actorUserId,
          target_request_id: requestId,
          response_status: response,
        },
      );
    },

    cancel({ actorUserId, requestId }) {
      return requestRpc(
        fetchImpl,
        supabaseUrl,
        serviceRoleKey,
        'cancel_team_membership_request',
        { actor_user_id: actorUserId, target_request_id: requestId },
      );
    },
  };
}
