import {
  addAdminSeasonTeamCommand,
  assignAdminTeamCaptainCommand,
  createPreparedAdminSeasonTeamCommand,
  listAdminSeasonTeamsCommand,
  listAdminTeamCaptainCandidatesCommand,
} from './adminSeasonTeamsCommands.js';
import { createAdminSeasonTeamsRepository } from './adminSeasonTeamsRepository.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

export function adminSeasonTeamsStatusFor(error) {
  return rpcErrorStatus(error);
}

async function readJson(request) {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== 'object') {
      throw new Error('Request body must be a JSON object');
    }
    return body;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('Request body must be valid JSON');
    throw error;
  }
}

export function createAdminSeasonTeamsHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createAdminSeasonTeamsRepository,
} = {}) {
  async function withActor(request, env, fetchImpl, action) {
    try {
      const actor = await authenticate(request, env, { fetch: fetchImpl });
      const repository = createRepository(env, { fetch: fetchImpl });
      return await action(actor, repository);
    } catch (error) {
      return Response.json({ error: safeClientErrorMessage(error) }, { status: adminSeasonTeamsStatusFor(error) });
    }
  }

  return {
    list(request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const state = await listAdminSeasonTeamsCommand({
          actorUserId: actor.id,
          seasonId,
        }, repository);
        return Response.json(state);
      });
    },

    createPrepared(request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJson(request);
        const team = await createPreparedAdminSeasonTeamCommand({
          actorUserId: actor.id,
          seasonId,
          teamName: body.teamName ?? body.team_name,
        }, repository);
        // Prepared rows are seed-only until captain + minimum roster qualify for a slot (#624).
        return Response.json({
          team,
          occupiesSlot: false,
          note: 'Prepared teams do not count toward the 8 registration slots until they have a captain, enough roster depth, and an accepted/confirmed slot.',
        }, { status: 201 });
      });
    },

    add(request, env, seasonId, teamId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const team = await addAdminSeasonTeamCommand({
          actorUserId: actor.id,
          seasonId,
          teamId,
        }, repository);
        return Response.json({ team }, { status: 201 });
      });
    },

    listCaptainCandidates(
      request,
      env,
      seasonId,
      teamId,
      { fetch: fetchImpl = globalThis.fetch } = {},
    ) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const players = await listAdminTeamCaptainCandidatesCommand({
          actorUserId: actor.id,
          seasonId,
          teamId,
        }, repository);
        return Response.json({ players });
      });
    },

    assignCaptain(
      request,
      env,
      seasonId,
      teamId,
      { fetch: fetchImpl = globalThis.fetch } = {},
    ) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJson(request);
        const captain = await assignAdminTeamCaptainCommand({
          actorUserId: actor.id,
          seasonId,
          teamId,
          playerId: body.playerId ?? body.player_id,
        }, repository);
        return Response.json({ captain });
      });
    },
  };
}

export const adminSeasonTeamsHttpHandlers = createAdminSeasonTeamsHttpHandlers();
