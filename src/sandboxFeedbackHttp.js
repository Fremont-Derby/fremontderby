import { authenticateSupabaseUser } from './supabaseAuth.js';
import {
  listSandboxFeedbackCommand,
  resolveSandboxFeedbackCommand,
  submitSandboxFeedbackCommand,
} from './sandboxFeedbackCommands.js';
import { createSandboxFeedbackRepository } from './sandboxFeedbackRepository.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

async function readJsonBody(request) {
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

function statusForError(error) {
  const message = error?.message || 'Request failed';
  if (/401/.test(message)) return 401;
  if (/403|League admin access is required/i.test(message)) return 403;
  if (/not found/i.test(message)) return 404;
  return 400;
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
        return jsonResponse({ error: error.message }, statusForError(error));
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
        return jsonResponse({ error: error.message }, statusForError(error));
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
        return jsonResponse({ error: error.message }, statusForError(error));
      }
    },
  };
}

export const sandboxFeedbackHttpHandlers = createSandboxFeedbackHttpHandlers();
