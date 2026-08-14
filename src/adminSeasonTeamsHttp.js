import {
  addAdminSeasonTeamCommand,
  assignAdminTeamCaptainCommand,
  createPreparedAdminSeasonTeamCommand,
  listAdminSeasonTeamsCommand,
  listAdminTeamCaptainCandidatesCommand,
} from './adminSeasonTeamsCommands.js';
import { createAdminSeasonTeamsRepository } from './adminSeasonTeamsRepository.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';

export function adminSeasonTeamsStatusFor(error) {
  const message = error?.message || 'Request failed';
  if (message.includes('Actor is not a league admin')) return 403;
  if (message.includes('Supabase request failed with 401')) return 401;
  if (message.includes('Supabase request failed with 403')) return 403;
  if (message.includes('Season not found') || message.includes('Team not found') || message.includes('Player not found')) return 404;
  if (
    message.includes('already exists')
    || message.includes('already has an active captain')
    || message.includes('already captains another team')
    || message.includes('Phone number is required')
    || message.includes('must be qualified before it can take a season slot')
  ) return 409;
  if (message.includes('No team slots') || message.includes('before season publication')) return 409;
  return 400;
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
      return Response.json({ error: error.message }, { status: adminSeasonTeamsStatusFor(error) });
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
        return Response.json({ team }, { status: 201 });
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
