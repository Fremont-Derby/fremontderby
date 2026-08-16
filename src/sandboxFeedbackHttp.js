import { readSanitizedJsonBody, safeClientErrorMessage } from './requestSanitize.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';
import {
  listSandboxFeedbackCommand,
  resolveSandboxFeedbackCommand,
  submitSandboxFeedbackCommand,
} from './sandboxFeedbackCommands.js';
import { createSandboxFeedbackRepository } from './sandboxFeedbackRepository.js';
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

export function sandboxFeedbackStatusForError(error) {
  return rpcErrorStatus(error);
}

export function createSandboxFeedbackHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createSandboxFeedbackRepository,
} = {}) {
  return {
    async submit(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const body = await readJsonBody(request);
        const repository = createRepository(env, { fetch: fetchImpl });
        const feedback = await submitSandboxFeedbackCommand({
          actorUserId: actor.id,
          surface: body.surface,
          path: body.path,
          context: body.context,
          comment: body.comment,
        }, repository);
        return jsonResponse({ feedback }, 201);
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, sandboxFeedbackStatusForError(error));
      }
    },

    async list(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const url = new URL(request.url);
        const repository = createRepository(env, { fetch: fetchImpl });
        const feedback = await listSandboxFeedbackCommand({
          actorUserId: actor.id,
          status: url.searchParams.get('status') || 'open',
          limit: Number(url.searchParams.get('limit') || 100),
        }, repository);
        return jsonResponse({ feedback });
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, sandboxFeedbackStatusForError(error));
      }
    },

    async resolve(request, env, feedbackId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const repository = createRepository(env, { fetch: fetchImpl });
        const feedback = await resolveSandboxFeedbackCommand({
          actorUserId: actor.id,
          feedbackId,
        }, repository);
        return jsonResponse({ feedback });
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, sandboxFeedbackStatusForError(error));
      }
    },
  };
}

export const sandboxFeedbackHttpHandlers = createSandboxFeedbackHttpHandlers();
