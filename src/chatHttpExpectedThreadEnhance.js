import {
  chatHttpHandlers,
  chatStatusForError,
} from './chatHttp.js';
import {
  sendDirectMessageCommand,
  sendLeagueMessageCommand,
  sendMatchupMessageCommand,
  sendTeamMessageCommand,
} from './chatCommands.js';
import { createChatRepository } from './chatRepository.js';
import { readSanitizedJsonBody, safeClientErrorMessage } from './requestSanitize.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function expectedThreadId(body, keys) {
  if (!body || typeof body !== 'object') return undefined;
  for (const key of keys) {
    const value = String(body[key] ?? '').trim();
    if (value) return value;
  }
  return undefined;
}

async function withActor(request, env, fetchImpl) {
  const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
  return {
    actor,
    repository: createChatRepository(env, { fetch: fetchImpl }),
  };
}

export function enhanceChatHttpExpectedThread() {
  chatHttpHandlers.sendTeamMessage = async function handleSendTeamMessageRequest(
    request,
    env,
    teamId,
    { fetch: fetchImpl = globalThis.fetch } = {},
  ) {
    try {
      const { actor, repository } = await withActor(request, env, fetchImpl);
      const body = await readSanitizedJsonBody(request);
      const message = await sendTeamMessageCommand({
        actorUserId: actor.id,
        teamId,
        expectedTeamId: expectedThreadId(body, ['expectedTeamId', 'expectedThreadId']),
        body: body.body,
        clientMessageId: body.clientMessageId ?? body.client_message_id,
      }, repository);
      return jsonResponse({ message }, 201);
    } catch (error) {
      return jsonResponse({ error: safeClientErrorMessage(error) }, chatStatusForError(error));
    }
  };

  chatHttpHandlers.sendDirectMessage = async function handleSendDirectMessageRequest(
    request,
    env,
    conversationId,
    { fetch: fetchImpl = globalThis.fetch } = {},
  ) {
    try {
      const { actor, repository } = await withActor(request, env, fetchImpl);
      const body = await readSanitizedJsonBody(request);
      const message = await sendDirectMessageCommand({
        actorUserId: actor.id,
        conversationId,
        expectedConversationId: expectedThreadId(body, ['expectedConversationId', 'expectedThreadId']),
        body: body.body,
        clientMessageId: body.clientMessageId ?? body.client_message_id,
      }, repository);
      return jsonResponse({ message }, 201);
    } catch (error) {
      return jsonResponse({ error: safeClientErrorMessage(error) }, chatStatusForError(error));
    }
  };

  chatHttpHandlers.sendLeagueMessage = async function handleSendLeagueMessageRequest(
    request,
    env,
    seasonId,
    { fetch: fetchImpl = globalThis.fetch } = {},
  ) {
    try {
      const { actor, repository } = await withActor(request, env, fetchImpl);
      const body = await readSanitizedJsonBody(request);
      const message = await sendLeagueMessageCommand({
        actorUserId: actor.id,
        seasonId,
        expectedSeasonId: expectedThreadId(body, ['expectedSeasonId', 'expectedThreadId']),
        body: body.body,
        clientMessageId: body.clientMessageId ?? body.client_message_id,
      }, repository);
      return jsonResponse({ message }, 201);
    } catch (error) {
      return jsonResponse({ error: safeClientErrorMessage(error) }, chatStatusForError(error));
    }
  };

  chatHttpHandlers.sendMatchupMessage = async function handleSendMatchupMessageRequest(
    request,
    env,
    teamMatchId,
    { fetch: fetchImpl = globalThis.fetch } = {},
  ) {
    try {
      const { actor, repository } = await withActor(request, env, fetchImpl);
      const body = await readSanitizedJsonBody(request);
      const message = await sendMatchupMessageCommand({
        actorUserId: actor.id,
        teamMatchId,
        expectedTeamMatchId: expectedThreadId(body, ['expectedTeamMatchId', 'expectedThreadId']),
        body: body.body,
        clientMessageId: body.clientMessageId ?? body.client_message_id,
      }, repository);
      return jsonResponse({ message }, 201);
    } catch (error) {
      return jsonResponse({ error: safeClientErrorMessage(error) }, chatStatusForError(error));
    }
  };

  return chatHttpHandlers;
}

enhanceChatHttpExpectedThread();
