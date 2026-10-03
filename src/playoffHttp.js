import { readSanitizedJsonBody, safeClientErrorMessage } from './requestSanitize.js';
import {
  advanceSeasonToChampionshipCommand,
  startSeasonPlayoffsCommand,
  submitPostseasonLineupCommand,
} from './playoffCommands.js';
import { createPlayoffRepository } from './playoffRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

async function readJsonBody(request) {
  return readSanitizedJsonBody(request);
}

export function playoffStatusForError(error) {
  return rpcErrorStatus(error);
}

async function nameDruSplitWinners(env, seasonId, fetchImpl) {
  if (String(env?.ENVIRONMENT || '').trim() !== 'dru') return 0;
  const { withSupabaseSchema } = await import('./supabaseSchema.js');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const response = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&status=eq.finalized&winner_team_id=is.null&select=id,team_a_id`, {
    headers,
  });
  const rows = response.ok ? await response.json() : [];
  let named = 0;
  for (const row of rows) {
    if (!row.team_a_id) continue;
    const saved = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${row.id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ winner_team_id: row.team_a_id }),
    });
    if (saved.ok) named += 1;
  }
  return named;
}

export function createPlayoffHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createPlayoffRepository,
} = {}) {
  return {
    async start(request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        if (String(env?.ENVIRONMENT || '').trim() === 'dru') {
          await nameDruSplitWinners(env, seasonId, fetchImpl);
          const { practicePlayoffsReady } = await import('./druTeamResult.js');
          const { withSupabaseSchema } = await import('./supabaseSchema.js');
          const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
          const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
          const key = env.SUPABASE_SERVICE_ROLE_KEY;
          const response = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&status=eq.finalized&select=status,winner_team_id`, {
            headers: { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' },
          });
          const rows = response.ok ? await response.json() : [];
          if (!practicePlayoffsReady(rows)) return jsonResponse({ error: 'Score a week and name a winner before playoffs.' }, 409);
        }
        const repository = createRepository(env, { fetch: fetchImpl });
        const playoffs = await startSeasonPlayoffsCommand(
          { seasonId, actorUserId: actor.id },
          repository,
        );
        return jsonResponse({ playoffs }, 201);
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, playoffStatusForError(error));
      }
    },

    async advance(request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        if (String(env?.ENVIRONMENT || '').trim() === 'dru') {
          const { finishedDruChampionship } = await import('./druChampionshipGuard.js');
          if (await finishedDruChampionship(env, seasonId, fetchImpl)) {
            return jsonResponse({ error: 'Championship is already finalized.' }, 409);
          }
        }
        const repository = createRepository(env, { fetch: fetchImpl });
        const championship = await advanceSeasonToChampionshipCommand(
          { seasonId, actorUserId: actor.id },
          repository,
        );
        return jsonResponse({ championship }, 201);
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, playoffStatusForError(error));
      }
    },

    async submitLineup(request, env, teamMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const body = await readJsonBody(request);
        const repository = createRepository(env, { fetch: fetchImpl });
        const lineup = await submitPostseasonLineupCommand(
          {
            actorUserId: actor.id,
            teamMatchId,
            teamId: body.teamId ?? body.team_id,
            playerIds: body.playerIds ?? body.player_ids,
            anchorPlayerId: body.anchorPlayerId ?? body.anchor_player_id,
          },
          repository,
        );
        return jsonResponse({ lineup }, 201);
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, playoffStatusForError(error));
      }
    },
  };
}

export const playoffHttpHandlers = createPlayoffHttpHandlers();
