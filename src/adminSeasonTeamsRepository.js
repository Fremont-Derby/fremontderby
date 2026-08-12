import { deriveAdminSeasonTeamEntry } from './adminSeasonTeamEntry.js';

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
      const [registrationPayload, candidatesPayload, readinessPayload] = await Promise.all([
        rpc(fetchImpl, url, headers, 'get_admin_season_registration', {
          actor_user_id: actorUserId,
          target_season_id: seasonId,
        }),
        rpc(fetchImpl, url, headers, 'list_admin_season_team_candidates', {
          actor_user_id: actorUserId,
          target_season_id: seasonId,
        }),
        rpc(fetchImpl, url, headers, 'list_admin_player_contact_readiness', {
          actor_user_id: actorUserId,
        }),
      ]);
      const registrationRow = Array.isArray(registrationPayload)
        ? registrationPayload[0]
        : registrationPayload;
      const registration = registrationRow?.registration ?? registrationRow ?? null;
      const readiness = new Map(
        (Array.isArray(readinessPayload) ? readinessPayload : [])
          .map((row) => [row.player_id, Boolean(row.has_phone)]),
      );
      const teams = (Array.isArray(candidatesPayload) ? candidatesPayload : []).map((row) => {
        const entry = deriveAdminSeasonTeamEntry(row, registration);
        return {
          ...row,
          captain_has_phone: row.captain_player_id
            ? Boolean(readiness.get(row.captain_player_id))
            : false,
          slot_workflow_status: row.slot_status ?? null,
          slot_status: entry.reason,
          entry_status: entry.entryStatus,
          entry_reason: entry.reason,
          qualified_for_slot: entry.qualified,
          can_take_slot: entry.canTakeSlot,
        };
      });
      return {
        registration,
        teams,
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

    async listCaptainCandidates({ actorUserId, seasonId, teamId }) {
      const payload = await rpc(fetchImpl, url, headers, 'list_admin_team_captain_candidates', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        target_team_id: teamId,
      });
      return (Array.isArray(payload) ? payload : []).map((row) => ({
        playerId: row.player_id,
        displayName: row.display_name,
        hasLogin: Boolean(row.has_login),
        hasPhone: Boolean(row.has_phone),
        rosteredOnTeam: Boolean(row.rostered_on_team),
        captainTeamId: row.captain_team_id ?? null,
        captainTeamName: row.captain_team_name ?? null,
      }));
    },

    async assignCaptain({ actorUserId, seasonId, teamId, playerId }) {
      const payload = await rpc(fetchImpl, url, headers, 'admin_assign_team_captain', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        target_team_id: teamId,
        target_player_id: playerId,
      });
      const row = Array.isArray(payload) ? payload[0] : payload;
      return {
        teamId: row?.team_id ?? teamId,
        playerId: row?.player_id ?? playerId,
        displayName: row?.display_name ?? null,
        hasLogin: Boolean(row?.has_login),
        hasPhone: Boolean(row?.has_phone),
      };
    },
  };
}
