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

function participantFacingError(body, status) {
  const message = typeof body === 'string' ? body : body?.message;
  const normalized = String(message || '').toLowerCase();

  if (normalized.includes('lineup player is not eligible')) {
    return 'That player is no longer eligible for this matchup. Refresh the lineup and choose another player.';
  }
  if (
    normalized.includes('both captains have submitted') ||
    normalized.includes('lineup is locked after submission')
  ) {
    return 'Both captains have submitted. This lineup is locked.';
  }
  if (normalized.includes('player is already scheduled for another team')) {
    return 'Player is already scheduled for another team this round. Choose another player.';
  }
  if (normalized.includes('lineup deadline has passed')) {
    return 'The lineup deadline has passed.';
  }

  return `Fremont Derby could not save the lineup${status ? ` (${status})` : ''}. Refresh and try again.`;
}

async function requestJson(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const body = await parseResponse(response);

  if (!response.ok) {
    throw new Error(participantFacingError(body, response.status));
  }

  return body;
}

export function createLineupRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }
  fetchImpl = withSupabaseSchema(fetchImpl, env);

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async submitTeamLineup({ actorUserId, teamId, roundId, slots }) {
      const lineup = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/submit_team_lineup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_team_id: teamId,
          target_round_id: roundId,
          lineup_slots: slots,
        }),
      });

      return Array.isArray(lineup) ? lineup : [];
    },

    async listVisibleTeamLineups({ actorUserId, teamId, roundId }) {
      const lineups = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/list_visible_team_lineups`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_team_id: teamId,
          target_round_id: roundId,
        }),
      });

      return Array.isArray(lineups) ? lineups : [];
    },
  };
}
