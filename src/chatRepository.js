function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestRpc(fetchImpl, url, headers, body) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const result = await parseResponse(response);
  if (!response.ok) {
    const message = typeof result === 'string' ? result : result?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return result;
}

export function createChatRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');

  const baseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
  const rpc = (name, body) => requestRpc(
    fetchImpl,
    `${baseUrl}/rest/v1/rpc/${name}`,
    headers,
    body,
  );

  return {
    async listChatThreads({ actorUserId }) {
      return rpc('get_my_team_chat_inbox', { actor_user_id: actorUserId });
    },

    async listTeamMessages({ actorUserId, teamId, before, limit }) {
      return rpc('list_team_chat_messages', {
        actor_user_id: actorUserId,
        target_team_id: teamId,
        before_created_at: before,
        result_limit: limit,
      });
    },

    async sendTeamMessage({ actorUserId, teamId, body, clientMessageId }) {
      const result = await rpc('send_team_chat_message', {
        actor_user_id: actorUserId,
        target_team_id: teamId,
        message_body: body,
        message_client_id: clientMessageId,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async markTeamChatRead({ actorUserId, teamId, readAt }) {
      const result = await rpc('mark_team_chat_read', {
        actor_user_id: actorUserId,
        target_team_id: teamId,
        read_through_at: readAt,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async listDirectMessageCandidates({ actorUserId }) {
      return rpc('list_direct_message_candidates', { actor_user_id: actorUserId });
    },

    async listDirectMessageInbox({ actorUserId }) {
      return rpc('get_my_direct_message_inbox', { actor_user_id: actorUserId });
    },

    async startDirectConversation({ actorUserId, seasonId, playerId }) {
      const result = await rpc('start_direct_conversation', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        target_player_id: playerId,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async listDirectMessages({
      actorUserId,
      conversationId,
      before,
      beforeMessageId,
      limit,
    }) {
      return rpc('list_direct_messages', {
        actor_user_id: actorUserId,
        target_conversation_id: conversationId,
        before_created_at: before,
        before_message_id: beforeMessageId,
        result_limit: limit,
      });
    },

    async sendDirectMessage({
      actorUserId,
      conversationId,
      body,
      clientMessageId,
    }) {
      const result = await rpc('send_direct_message', {
        actor_user_id: actorUserId,
        target_conversation_id: conversationId,
        message_body: body,
        message_client_id: clientMessageId,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async markDirectChatRead({ actorUserId, conversationId, readAt }) {
      const result = await rpc('mark_direct_chat_read', {
        actor_user_id: actorUserId,
        target_conversation_id: conversationId,
        read_through_at: readAt,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async blockPlayerChat({ actorUserId, playerId }) {
      const result = await rpc('block_player_chat', {
        actor_user_id: actorUserId,
        target_player_id: playerId,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async unblockPlayerChat({ actorUserId, playerId }) {
      return rpc('unblock_player_chat', {
        actor_user_id: actorUserId,
        target_player_id: playerId,
      });
    },

    async listBlockedChatPlayers({ actorUserId }) {
      return rpc('list_blocked_chat_players', { actor_user_id: actorUserId });
    },

    async listLeagueChatThreads({ actorUserId }) {
      return rpc('get_my_league_chat_inbox', { actor_user_id: actorUserId });
    },

    async listLeagueMessages({ actorUserId, seasonId, before, beforeMessageId, limit }) {
      return rpc('list_league_chat_messages', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        before_created_at: before,
        before_message_id: beforeMessageId,
        result_limit: limit,
      });
    },

    async sendLeagueMessage({ actorUserId, seasonId, body, clientMessageId }) {
      const result = await rpc('send_league_chat_message', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        message_body: body,
        message_client_id: clientMessageId,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async markLeagueChatRead({ actorUserId, seasonId, readAt }) {
      const result = await rpc('mark_league_chat_read', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        read_through_at: readAt,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async reportChatMessage({ actorUserId, messageType, messageId, reason, details }) {
      const result = await rpc('report_chat_message', {
        actor_user_id: actorUserId,
        target_type: messageType,
        target_message_id: messageId,
        report_reason: reason,
        report_details: details,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async listChatReports({ actorUserId, limit }) {
      return rpc('list_chat_message_reports', {
        actor_user_id: actorUserId,
        result_limit: limit,
      });
    },

    async moderateChatReport({ actorUserId, reportId, resolution, note, removeMessage }) {
      const result = await rpc('moderate_chat_message_report', {
        actor_user_id: actorUserId,
        target_report_id: reportId,
        resolution,
        moderation_note: note,
        remove_message: removeMessage,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async listMatchupChatThreads({ actorUserId }) {
      return rpc('get_my_matchup_chat_inbox', { actor_user_id: actorUserId });
    },

    async listMatchupMessages({ actorUserId, teamMatchId, before, beforeMessageId, limit }) {
      return rpc('list_matchup_chat_messages', {
        actor_user_id: actorUserId,
        target_team_match_id: teamMatchId,
        before_created_at: before,
        before_message_id: beforeMessageId,
        result_limit: limit,
      });
    },

    async sendMatchupMessage({ actorUserId, teamMatchId, body, clientMessageId }) {
      const result = await rpc('send_matchup_chat_message', {
        actor_user_id: actorUserId,
        target_team_match_id: teamMatchId,
        message_body: body,
        message_client_id: clientMessageId,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async markMatchupChatRead({ actorUserId, teamMatchId, readAt }) {
      const result = await rpc('mark_matchup_chat_read', {
        actor_user_id: actorUserId,
        target_team_match_id: teamMatchId,
        read_through_at: readAt,
      });
      return Array.isArray(result) ? result[0] : result;
    },
  };
}
