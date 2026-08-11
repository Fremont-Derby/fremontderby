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

export async function listLeagueChatThreadsCommand({ actorUserId }, repository) {
  return repository.listLeagueChatThreads({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
  });
}

export async function listLeagueMessagesCommand(
  { actorUserId, seasonId, before, beforeMessageId, limit },
  repository,
) {
  return repository.listLeagueMessages({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    seasonId: requireValue(seasonId, 'Season id is required'),
    before: before ? String(before) : null,
    beforeMessageId: beforeMessageId ? String(beforeMessageId) : null,
    limit: normalizedLimit(limit),
  });
}

export async function sendLeagueMessageCommand(
  { actorUserId, seasonId, body, clientMessageId },
  repository,
) {
  const normalizedBody = String(body ?? '').trim();
  if (!normalizedBody) throw new Error('Message cannot be empty');
  if (normalizedBody.length > 2000) throw new Error('Message cannot exceed 2000 characters');
  return repository.sendLeagueMessage({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    seasonId: requireValue(seasonId, 'Season id is required'),
    body: normalizedBody,
    clientMessageId: clientMessageId ? String(clientMessageId) : null,
  });
}

export async function markLeagueChatReadCommand(
  { actorUserId, seasonId, readAt },
  repository,
) {
  return repository.markLeagueChatRead({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    seasonId: requireValue(seasonId, 'Season id is required'),
    readAt: readAt ? String(readAt) : null,
  });
}

export async function reportChatMessageCommand(
  { actorUserId, messageType, messageId, reason, details },
  repository,
) {
  const normalizedType = requireValue(messageType, 'Message type is required').toLowerCase();
  if (!['team', 'direct', 'league'].includes(normalizedType)) {
    throw new Error('Unsupported chat message type');
  }
  const normalizedReason = requireValue(reason, 'Report reason is required').toLowerCase();
  if (!['harassment', 'spam', 'privacy', 'threat', 'other'].includes(normalizedReason)) {
    throw new Error('Choose a valid report reason');
  }
  const normalizedDetails = String(details ?? '').trim() || null;
  if (normalizedDetails && normalizedDetails.length > 1000) {
    throw new Error('Report details cannot exceed 1000 characters');
  }
  return repository.reportChatMessage({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    messageType: normalizedType,
    messageId: requireValue(messageId, 'Message id is required'),
    reason: normalizedReason,
    details: normalizedDetails,
  });
}

export async function listChatReportsCommand(
  { actorUserId, limit },
  repository,
) {
  return repository.listChatReports({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    limit: normalizedLimit(limit),
  });
}

export async function moderateChatReportCommand(
  { actorUserId, reportId, resolution, note, removeMessage },
  repository,
) {
  const normalizedResolution = requireValue(resolution, 'Resolution is required').toLowerCase();
  if (!['resolved', 'dismissed'].includes(normalizedResolution)) {
    throw new Error('Resolution must be resolved or dismissed');
  }
  const normalizedNote = String(note ?? '').trim() || null;
  if (normalizedNote && normalizedNote.length > 2000) {
    throw new Error('Moderation note cannot exceed 2000 characters');
  }
  if (removeMessage && normalizedResolution !== 'resolved') {
    throw new Error('A removed message must use resolved status');
  }
  return repository.moderateChatReport({
    actorUserId: requireValue(actorUserId, 'Actor user id is required'),
    reportId: requireValue(reportId, 'Report id is required'),
    resolution: normalizedResolution,
    note: normalizedNote,
    removeMessage: Boolean(removeMessage),
  });
}
