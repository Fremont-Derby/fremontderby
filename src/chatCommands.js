function requireValue(value, message) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(message);
  return normalized;
}

function normalizedLimit(value) {
  if (value == null || value === '') return 50;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('Message limit must be between 1 and 100');
  }
  return parsed;
}

export async function listChatThreadsCommand({ actorUserId }, repository) {
  return repository.listChatThreads({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
  });
}

export async function listTeamMessagesCommand(
  { actorUserId, teamId, before, limit },
  repository,
) {
  return repository.listTeamMessages({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    teamId: requireValue(teamId, 'Team id is required'),
    before: before ? String(before) : null,
    limit: normalizedLimit(limit),
  });
}

export async function sendTeamMessageCommand(
  { actorUserId, teamId, body, clientMessageId },
  repository,
) {
  const normalizedBody = String(body ?? '').trim();
  if (!normalizedBody) throw new Error('Message cannot be empty');
  if (normalizedBody.length > 2000) throw new Error('Message cannot exceed 2000 characters');

  return repository.sendTeamMessage({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    teamId: requireValue(teamId, 'Team id is required'),
    body: normalizedBody,
    clientMessageId: clientMessageId ? String(clientMessageId) : null,
  });
}

export async function markTeamChatReadCommand(
  { actorUserId, teamId, readAt },
  repository,
) {
  return repository.markTeamChatRead({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    teamId: requireValue(teamId, 'Team id is required'),
    readAt: readAt ? String(readAt) : null,
  });
}

export async function listDirectMessageCandidatesCommand({ actorUserId }, repository) {
  return repository.listDirectMessageCandidates({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
  });
}

export async function listDirectMessageInboxCommand({ actorUserId }, repository) {
  return repository.listDirectMessageInbox({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
  });
}

export async function startDirectConversationCommand(
  { actorUserId, seasonId, playerId },
  repository,
) {
  return repository.startDirectConversation({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    seasonId: requireValue(seasonId, 'Season id is required'),
    playerId: requireValue(playerId, 'Player id is required'),
  });
}

export async function listDirectMessagesCommand(
  { actorUserId, conversationId, before, beforeMessageId, limit },
  repository,
) {
  return repository.listDirectMessages({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    conversationId: requireValue(conversationId, 'Conversation id is required'),
    before: before ? String(before) : null,
    beforeMessageId: beforeMessageId ? String(beforeMessageId) : null,
    limit: normalizedLimit(limit),
  });
}

export async function sendDirectMessageCommand(
  { actorUserId, conversationId, body, clientMessageId },
  repository,
) {
  const normalizedBody = String(body ?? '').trim();
  if (!normalizedBody) throw new Error('Message cannot be empty');
  if (normalizedBody.length > 2000) throw new Error('Message cannot exceed 2000 characters');

  return repository.sendDirectMessage({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    conversationId: requireValue(conversationId, 'Conversation id is required'),
    body: normalizedBody,
    clientMessageId: clientMessageId ? String(clientMessageId) : null,
  });
}

export async function markDirectChatReadCommand(
  { actorUserId, conversationId, readAt },
  repository,
) {
  return repository.markDirectChatRead({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    conversationId: requireValue(conversationId, 'Conversation id is required'),
    readAt: readAt ? String(readAt) : null,
  });
}

export async function blockPlayerChatCommand(
  { actorUserId, playerId },
  repository,
) {
  return repository.blockPlayerChat({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    playerId: requireValue(playerId, 'Player id is required'),
  });
}

export async function unblockPlayerChatCommand(
  { actorUserId, playerId },
  repository,
) {
  return repository.unblockPlayerChat({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    playerId: requireValue(playerId, 'Player id is required'),
  });
}

export async function listBlockedChatPlayersCommand({ actorUserId }, repository) {
  return repository.listBlockedChatPlayers({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
  });
}
