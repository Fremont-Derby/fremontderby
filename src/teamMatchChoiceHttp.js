import { jsonNoStore } from './httpJson.js';
import {
  chooseTeamMatchTeamCommand,
  listMyTeamMatchChoicesCommand,
} from './teamMatchChoiceCommands.js';
import { createTeamMatchChoiceRepository } from './teamMatchChoiceRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

const jsonResponse = jsonNoStore;

async function readJsonBody(request) {
  const text = await request.text();
  if (!text.trim()) return {};
  const body = JSON.parse(text);
  if (!body || Array.isArray(body) || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object');
  }
  return body;
}

export function teamMatchChoiceStatusForError(error) {
  if (error instanceof AuthError) return error.status;
  const message = error?.message || '';
  if (message.includes('Player profile is required')) return 403;
  if (message.includes('active member of both teams')) return 403;
  if (message.includes('not part of this team matchup')) return 403;
  if (message.includes('Team matchup not found')) return 404;
  if (message.includes('locked after a lineup includes you')) return 409;
  if (message.startsWith('Supabase request failed with 401')) return 401;
  if (message.startsWith('Supabase request failed with 403')) return 403;
  return 400;
}

function publicError(error, fallback) {
  const message = error?.message || '';
  if (message.startsWith('Supabase request failed')) return fallback;
  return message || fallback;
}

export const teamMatchChoiceHttpHandlers = {
  async list(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
    try {
      const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
      const repository = createTeamMatchChoiceRepository(env, { fetch: fetchImpl });
      const choices = await listMyTeamMatchChoicesCommand(
        { actorUserId: actor.id },
        repository,
      );
      return jsonResponse({ choices });
    } catch (error) {
      return jsonResponse(
        { error: publicError(error, 'Team choices are unavailable right now. Please try again.') },
        teamMatchChoiceStatusForError(error),
      );
    }
  },

  async choose(request, env, teamMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
    try {
      const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
      const body = await readJsonBody(request);
      const repository = createTeamMatchChoiceRepository(env, { fetch: fetchImpl });
      const choice = await chooseTeamMatchTeamCommand(
        {
          actorUserId: actor.id,
          teamMatchId,
          teamId: body.teamId ?? body.team_id,
        },
        repository,
      );
      return jsonResponse({ choice });
    } catch (error) {
      return jsonResponse(
        { error: publicError(error, 'We could not save your team choice. Please try again.') },
        teamMatchChoiceStatusForError(error),
      );
    }
  },
};
