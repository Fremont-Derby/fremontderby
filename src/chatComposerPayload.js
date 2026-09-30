export function chatSendPayload({ body, clientMessageId, thread } = {}) {
  const payload = {
    body: String(body ?? ''),
  };
  if (clientMessageId) payload.clientMessageId = String(clientMessageId);

  const kind = String(thread?.kind || thread?.type || '').toLowerCase();
  const id = String(thread?.id || thread?.threadId || '').trim();
  if (!id) return payload;

  payload.expectedThreadId = id;
  if (kind === 'direct' || kind === 'player' || kind === 'conversation') {
    payload.expectedConversationId = id;
  } else if (kind === 'team') {
    payload.expectedTeamId = id;
  } else if (kind === 'league' || kind === 'season') {
    payload.expectedSeasonId = id;
  } else if (kind === 'matchup') {
    payload.expectedTeamMatchId = id;
  }
  return payload;
}
