import {
  blockPlayerChatCommand,
  listChatThreadsCommand,
  listBlockedChatPlayersCommand,
  listDirectMessageCandidatesCommand,
  listDirectMessageInboxCommand,
  listDirectMessagesCommand,
  listLeagueChatThreadsCommand,
  listLeagueMessagesCommand,
  listMatchupChatThreadsCommand,
  listMatchupMessagesCommand,
  listChatReportsCommand,
  listTeamMessagesCommand,
  markDirectChatReadCommand,
  markTeamChatReadCommand,
  markLeagueChatReadCommand,
  markMatchupChatReadCommand,
  moderateChatReportCommand,
  reportChatMessageCommand,
  sendDirectMessageCommand,
  sendTeamMessageCommand,
  sendLeagueMessageCommand,
  sendMatchupMessageCommand,
  startDirectConversationCommand,
  unblockPlayerChatCommand,
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
  if (/Player not found|Direct conversation not found|Chat message not found|Chat report not found|Team matchup not found/i.test(error.message)) return 404;
  if (/membership is required|No team chat access/i.test(error.message)) return 403;
  if (/Direct messages are blocked|Both players must participate/i.test(error.message)) return 403;
  if (/League chat access|Active season participation|League admin access/i.test(error.message)) return 403;
  if (/Matchup chat access|matchup team membership|Completed matchup chats/i.test(error.message)) return 403;
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

function unreadCount(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((total, row) => {
    const count = Number(row?.unread_count);
    return total + (Number.isFinite(count) && count > 0 ? Math.floor(count) : 0);
  }, 0);
}

function previewBody(value) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157)}…`;
}

function unreadPreviews(rows, kind, labelFor) {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const count = Number(row?.unread_count);
    const body = previewBody(row?.last_message_body);
    if (!Number.isFinite(count) || count < 1 || !body) return [];
    return [{
      kind,
      label: labelFor(row),
      body,
      lastMessageAt: row?.last_message_at ?? null,
      unreadCount: Math.floor(count),
    }];
  });
}

function messagePreviews({ teams, direct, league, matchups }) {
  return [
    ...unreadPreviews(
      teams,
      'team',
      (row) => `${row?.team_name || 'Team'} · ${row?.season_name || 'Team chat'}`,
    ),
    ...unreadPreviews(
      direct,
      'direct',
      (row) => `Direct · ${row?.other_display_name || 'Player'}`,
    ),
    ...unreadPreviews(
      league,
      'league',
      (row) => `${row?.season_name || 'League'} · League chat`,
    ),
    ...unreadPreviews(
      matchups,
      'matchup',
      (row) => `${row?.team_a_name || 'Team A'} vs ${row?.team_b_name || 'Team B'}`,
    ),
  ].sort((left, right) => {
    const leftAt = Date.parse(left.lastMessageAt || '') || 0;
    const rightAt = Date.parse(right.lastMessageAt || '') || 0;
    return rightAt - leftAt;
  }).slice(0, 5);
}

export async function handleMessageNotificationSummaryRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const actorUserId = actor.id;
    const [teams, direct, league, matchups] = await Promise.all([
      repository.listChatThreads({ actorUserId }),
      repository.listDirectMessageInbox({ actorUserId }),
      repository.listLeagueChatThreads({ actorUserId }),
      repository.listMatchupChatThreads({ actorUserId }),
    ]);
    const unread = unreadCount(teams)
      + unreadCount(direct)
      + unreadCount(league)
      + unreadCount(matchups);
    return jsonResponse({
      unreadCount: unread,
      previews: messagePreviews({ teams, direct, league, matchups }),
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
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
  notificationSummary: handleMessageNotificationSummaryRequest,
  listThreads: handleListChatThreadsRequest,
  listTeamMessages: handleListTeamMessagesRequest,
  sendTeamMessage: handleSendTeamMessageRequest,
  markTeamChatRead: handleMarkTeamChatReadRequest,
};

export async function handleListDirectMessageCandidatesRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const candidates = await listDirectMessageCandidatesCommand(
      { actorUserId: actor.id },
      repository,
    );
    return jsonResponse({ candidates: Array.isArray(candidates) ? candidates : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListDirectMessageInboxRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const conversations = await listDirectMessageInboxCommand(
      { actorUserId: actor.id },
      repository,
    );
    return jsonResponse({ conversations: Array.isArray(conversations) ? conversations : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleStartDirectConversationRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const conversation = await startDirectConversationCommand({
      actorUserId: actor.id,
      seasonId: body.seasonId,
      playerId: body.playerId,
    }, repository);
    return jsonResponse({ conversation }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListDirectMessagesRequest(
  request,
  env,
  conversationId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const url = new URL(request.url);
    const messages = await listDirectMessagesCommand({
      actorUserId: actor.id,
      conversationId,
      before: url.searchParams.get('before'),
      beforeMessageId: url.searchParams.get('beforeMessageId'),
      limit: url.searchParams.get('limit'),
    }, repository);
    return jsonResponse({ messages: Array.isArray(messages) ? messages : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSendDirectMessageRequest(
  request,
  env,
  conversationId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const message = await sendDirectMessageCommand({
      actorUserId: actor.id,
      conversationId,
      body: body.body,
      clientMessageId: body.clientMessageId,
    }, repository);
    return jsonResponse({ message }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleMarkDirectChatReadRequest(
  request,
  env,
  conversationId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const readState = await markDirectChatReadCommand({
      actorUserId: actor.id,
      conversationId,
      readAt: body.readAt,
    }, repository);
    return jsonResponse({ readState });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleBlockPlayerChatRequest(
  request,
  env,
  playerId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const block = await blockPlayerChatCommand({
      actorUserId: actor.id,
      playerId,
    }, repository);
    return jsonResponse({ block }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleUnblockPlayerChatRequest(
  request,
  env,
  playerId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const unblocked = await unblockPlayerChatCommand({
      actorUserId: actor.id,
      playerId,
    }, repository);
    return jsonResponse({ unblocked: Boolean(unblocked) });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListBlockedChatPlayersRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const players = await listBlockedChatPlayersCommand(
      { actorUserId: actor.id },
      repository,
    );
    return jsonResponse({ players: Array.isArray(players) ? players : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

Object.assign(chatHttpHandlers, {
  listDirectCandidates: handleListDirectMessageCandidatesRequest,
  listDirectInbox: handleListDirectMessageInboxRequest,
  startDirectConversation: handleStartDirectConversationRequest,
  listDirectMessages: handleListDirectMessagesRequest,
  sendDirectMessage: handleSendDirectMessageRequest,
  markDirectChatRead: handleMarkDirectChatReadRequest,
  blockPlayer: handleBlockPlayerChatRequest,
  unblockPlayer: handleUnblockPlayerChatRequest,
  listBlockedPlayers: handleListBlockedChatPlayersRequest,
});

export async function handleListLeagueChatThreadsRequest(
  request, env, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const threads = await listLeagueChatThreadsCommand({ actorUserId: actor.id }, repository);
    return jsonResponse({ threads: Array.isArray(threads) ? threads : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListLeagueMessagesRequest(
  request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const url = new URL(request.url);
    const messages = await listLeagueMessagesCommand({
      actorUserId: actor.id,
      seasonId,
      before: url.searchParams.get('before'),
      beforeMessageId: url.searchParams.get('beforeMessageId'),
      limit: url.searchParams.get('limit'),
    }, repository);
    return jsonResponse({ messages: Array.isArray(messages) ? messages : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSendLeagueMessageRequest(
  request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const message = await sendLeagueMessageCommand({
      actorUserId: actor.id, seasonId, body: body.body,
      clientMessageId: body.clientMessageId,
    }, repository);
    return jsonResponse({ message }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleMarkLeagueChatReadRequest(
  request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const readState = await markLeagueChatReadCommand({
      actorUserId: actor.id, seasonId, readAt: body.readAt,
    }, repository);
    return jsonResponse({ readState });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleReportChatMessageRequest(
  request, env, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const report = await reportChatMessageCommand({
      actorUserId: actor.id,
      messageType: body.messageType,
      messageId: body.messageId,
      reason: body.reason,
      details: body.details,
    }, repository);
    return jsonResponse({ report }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListChatReportsRequest(
  request, env, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const url = new URL(request.url);
    const reports = await listChatReportsCommand({
      actorUserId: actor.id, limit: url.searchParams.get('limit'),
    }, repository);
    return jsonResponse({ reports: Array.isArray(reports) ? reports : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleModerateChatReportRequest(
  request, env, reportId, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const result = await moderateChatReportCommand({
      actorUserId: actor.id,
      reportId,
      resolution: body.resolution,
      note: body.note,
      removeMessage: body.removeMessage,
    }, repository);
    return jsonResponse({ result });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

Object.assign(chatHttpHandlers, {
  listLeagueThreads: handleListLeagueChatThreadsRequest,
  listLeagueMessages: handleListLeagueMessagesRequest,
  sendLeagueMessage: handleSendLeagueMessageRequest,
  markLeagueChatRead: handleMarkLeagueChatReadRequest,
  reportMessage: handleReportChatMessageRequest,
  listReports: handleListChatReportsRequest,
  moderateReport: handleModerateChatReportRequest,
});

export async function handleListMatchupChatThreadsRequest(
  request, env, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const threads = await listMatchupChatThreadsCommand({ actorUserId: actor.id }, repository);
    return jsonResponse({ threads: Array.isArray(threads) ? threads : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleListMatchupMessagesRequest(
  request, env, teamMatchId, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const url = new URL(request.url);
    const messages = await listMatchupMessagesCommand({
      actorUserId: actor.id,
      teamMatchId,
      before: url.searchParams.get('before'),
      beforeMessageId: url.searchParams.get('beforeMessageId'),
      limit: url.searchParams.get('limit'),
    }, repository);
    return jsonResponse({ messages: Array.isArray(messages) ? messages : [] });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleSendMatchupMessageRequest(
  request, env, teamMatchId, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const message = await sendMatchupMessageCommand({
      actorUserId: actor.id, teamMatchId, body: body.body,
      clientMessageId: body.clientMessageId,
    }, repository);
    return jsonResponse({ message }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

export async function handleMarkMatchupChatReadRequest(
  request, env, teamMatchId, { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const { actor, repository } = await withActor(request, env, fetchImpl);
    const body = await readJsonBody(request);
    const readState = await markMatchupChatReadCommand({
      actorUserId: actor.id, teamMatchId, readAt: body.readAt,
    }, repository);
    return jsonResponse({ readState });
  } catch (error) {
    return jsonResponse({ error: error.message }, statusForError(error));
  }
}

Object.assign(chatHttpHandlers, {
  listMatchupThreads: handleListMatchupChatThreadsRequest,
  listMatchupMessages: handleListMatchupMessagesRequest,
  sendMatchupMessage: handleSendMatchupMessageRequest,
  markMatchupChatRead: handleMarkMatchupChatReadRequest,
});
