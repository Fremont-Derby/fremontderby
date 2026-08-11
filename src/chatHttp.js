import {
  listChatThreadsCommand,
  listTeamMessagesCommand,
  markTeamChatReadCommand,
  sendTeamMessageCommand,
} from './chatCommands.js';
import { createChatRepository } from './chatRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

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
  if (error instanceof AuthError) return error.status;
  if (/Team not found/i.test(error.message)) return 404;
  if (/membership is required|No team chat access/i.test(error.message)) return 403;
  if (/Player profile is required/i.test(error.message)) return 409;
  if (/Supabase request failed with 401/i.test(error.message)) return 401;
  if (/Supabase request failed with 403/i.test(error.message)) return 403;
  return 400;
}

async function withActor(request, env, fetchImpl) {
  const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
  return {
    actor,
    repository: createChatRepository(env, { fetch: fetchImpl }),
  };
}

export async function handleListChatThreadsRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const threads = await listChatThreadsCommand({ actorUserId: actor.id }, repository);
    return jsonResponse({ threads: Array.isArray(threads) ? threads : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListTeamMessagesRequest(
  request,
  env,
  teamId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const url = new URL(request.url);
    const messages = await listTeamMessagesCommand({
      actorUserId: actor.id,
      teamId,
      before: url.searchParams.get('before'),
      limit: url.searchParams.get('limit'),
    }, repository);
    return jsonResponse({ messages: Array.isArray(messages) ? messages : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSendTeamMessageRequest(
  request,
  env,
  teamId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const message = await sendTeamMessageCommand({
      actorUserId: actor.id,
      teamId,
      body: body.body,
      clientMessageId: body.clientMessageId,
    }, repository);
    return jsonResponse({ message }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleMarkTeamChatReadRequest(
  request,
  env,
  teamId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const readState = await markTeamChatReadCommand({
      actorUserId: actor.id,
      teamId,
      readAt: body.readAt,
    }, repository);
    return jsonResponse({ readState });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export const chatHttpHandlers = {
  listThreads: handleListChatThreadsRequest,
  listTeamMessages: handleListTeamMessagesRequest,
  sendTeamMessage: handleSendTeamMessageRequest,
  markTeamChatRead: handleMarkTeamChatReadRequest,
};
