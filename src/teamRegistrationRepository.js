import { withSupabaseSchema } from './supabaseSchema.js';
function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
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

async function requestRpc(fetchImpl, supabaseUrl, headers, name, body) {
  const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(
      `Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`,
    );
  }
  return Array.isArray(payload) ? payload[0] : payload;
}

export function createTeamRegistrationRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async getOwn({ actorUserId, seasonId }) {
      const result = await requestRpc(fetchImpl, supabaseUrl, headers, 'get_own_team_registration', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
      });
      return result?.registration ?? result;
    },

    submitApplication({ actorUserId, seasonId, teamName }) {
      return requestRpc(fetchImpl, supabaseUrl, headers, 'submit_team_application', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        proposed_team_name: teamName,
      });
    },

    withdrawApplication({ actorUserId, applicationId }) {
      return requestRpc(fetchImpl, supabaseUrl, headers, 'withdraw_team_application', {
        actor_user_id: actorUserId,
        target_application_id: applicationId,
      });
    },

    respondToReturningSlot({ actorUserId, slotId, action, transferPlayerId }) {
      return requestRpc(fetchImpl, supabaseUrl, headers, 'respond_to_returning_team_slot', {
        actor_user_id: actorUserId,
        target_slot_id: slotId,
        response_action: action,
        transfer_player_id: transferPlayerId ?? null,
      });
    },

    async getAdmin({ actorUserId, seasonId }) {
      const result = await requestRpc(fetchImpl, supabaseUrl, headers, 'get_admin_season_registration', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
      });
      return result?.registration ?? result;
    },

    configure({
      actorUserId,
      seasonId,
      teamCapacity,
      minimumCommittedRoster,
      returningReservationDeadline,
      conditionalHoldDays,
    }) {
      return requestRpc(fetchImpl, supabaseUrl, headers, 'configure_season_registration', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        configured_team_capacity: teamCapacity,
        configured_minimum_committed_roster: minimumCommittedRoster,
        configured_returning_reservation_deadline: returningReservationDeadline ?? null,
        configured_conditional_hold_days: conditionalHoldDays,
      });
    },

    reviewApplication({ actorUserId, applicationId, decision, reason }) {
      return requestRpc(fetchImpl, supabaseUrl, headers, 'admin_review_team_application', {
        actor_user_id: actorUserId,
        target_application_id: applicationId,
        review_decision: decision,
        review_reason: reason ?? null,
      });
    },

    manageSlot({ actorUserId, slotId, action, reason, extensionDays }) {
      return requestRpc(fetchImpl, supabaseUrl, headers, 'admin_manage_team_slot', {
        actor_user_id: actorUserId,
        target_slot_id: slotId,
        slot_action: action,
        action_reason: reason ?? null,
        extension_days: extensionDays ?? null,
      });
    },

    seedReturningSlots({ actorUserId, seasonId, sourceSeasonId }) {
      return requestRpc(fetchImpl, supabaseUrl, headers, 'seed_returning_team_slots', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        source_season_id: sourceSeasonId,
      });
    },
  };
}
