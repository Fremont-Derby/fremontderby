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

function headers(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
}

async function parsePayload(response) {
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
  const payload = await parsePayload(response);
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return payload;
}

async function requestRpc(fetchImpl, supabaseUrl, serviceRoleKey, rpcName, body, { expectArray = false } = {}) {
  const payload = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    headers: headers(serviceRoleKey),
    body: JSON.stringify(body),
  });
  if (expectArray) {
    return Array.isArray(payload) ? payload : [];
  }
  // PostgREST may wrap a single composite row as a one-element array.
  return Array.isArray(payload) ? payload[0] : payload;
}

export function createTeamMembershipRequestRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const serviceHeaders = headers(serviceRoleKey);

  return {
    async listOwn({ actorUserId }) {
      const requests = await requestRpc(
        fetchImpl,
        supabaseUrl,
        serviceRoleKey,
        'get_own_team_membership_requests',
        { actor_user_id: actorUserId },
      );

      const players = await requestJson(
        fetchImpl,
        `${supabaseUrl}/rest/v1/players?select=id&user_id=eq.${encodeURIComponent(actorUserId)}&limit=1`,
        { method: 'GET', headers: serviceHeaders },
      );
      const playerId = Array.isArray(players) ? players[0]?.id : null;

      let activeMemberships = [];
      if (playerId) {
        activeMemberships = await requestJson(
          fetchImpl,
          `${supabaseUrl}/rest/v1/team_memberships?select=season_id,team_id&player_id=eq.${encodeURIComponent(playerId)}&ends_at=is.null`,
          { method: 'GET', headers: serviceHeaders },
        );
      }
      const membershipRows = Array.isArray(activeMemberships) ? activeMemberships : [];
      const activeSeasonIds = new Set(membershipRows.map((row) => row.season_id));
      const activeTeamIds = new Set(membershipRows.map((row) => row.team_id));

      const teams = await requestRpc(
        fetchImpl,
        supabaseUrl,
        serviceRoleKey,
        'list_joinable_team_registration',
        {},
        { expectArray: true },
      );
      const pendingByTeam = new Map(
        (requests?.player_requests ?? [])
          .filter((request) => request.status === 'pending')
          .map((request) => [request.teamId, request]),
      );
      // Season-wide membership uniqueness: hide teams in seasons the player already belongs to,
      // and never list a team the player is already on.
      const joinableTeams = (Array.isArray(teams) ? teams : [])
        .filter((team) => !activeTeamIds.has(team.team_id) && !activeSeasonIds.has(team.season_id))
        .map((team) => ({
          teamId: team.team_id,
          teamName: team.team_name,
          seasonId: team.season_id,
          seasonName: team.season_name,
          seasonStatus: team.season_status,
          slotStatus: team.slot_status,
          hasActiveMembership: false,
          pendingRequestId: pendingByTeam.get(team.team_id)?.requestId ?? null,
        }));

      return {
        ...(requests ?? { player_requests: [], captain_requests: [] }),
        joinable_teams: joinableTeams,
      };
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

