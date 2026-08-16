import { withSupabaseSchema } from './supabaseSchema.js';
function requireEnv(env, key) {
  const value = env?.[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}

async function requestJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, options);
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }
  if (!response.ok) {
    const error = new Error(body?.message || body?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export function createNotificationRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  const supabaseUrl = requireEnv(env, 'SUPABASE_URL').replace(/\/$/, '');
  const serviceRoleKey = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'content-type': 'application/json',
  };

  return {
    async listMyNotifications({ actorUserId, limit }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/list_my_notifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ actor_user_id: actorUserId, result_limit: limit ?? 50 }),
      });
      return (Array.isArray(result) ? result : []).map((row) => ({
        id: row.id,
        kind: row.kind,
        title: row.title,
        body: row.body,
        href: row.href,
        teamId: row.team_id,
        teamMatchId: row.team_match_id,
        seasonId: row.season_id,
        readAt: row.read_at,
        createdAt: row.created_at,
      }));
    },

    async markNotificationRead({ actorUserId, notificationId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/mark_my_notification_read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_notification_id: notificationId,
        }),
      });
      const row = Array.isArray(result) ? result[0] : result;
      return { id: row?.id ?? notificationId, readAt: row?.read_at ?? null };
    },

    async markAllNotificationsRead({ actorUserId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/mark_all_my_notifications_read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ actor_user_id: actorUserId }),
      });
      return { updated: Number(result) || 0 };
    },

    async adminBroadcastNotification({ actorUserId, title, body, seasonId, href }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/admin_broadcast_notification`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          notice_title: title,
          notice_body: body,
          target_season_id: seasonId,
          notice_href: href,
        }),
      });
      return { sent: Number(result) || 0 };
    },

    async createUserNotification({
      recipientUserId,
      kind,
      title,
      body,
      href,
      teamId,
      teamMatchId,
      seasonId,
      actorUserId,
    }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/create_user_notification`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipient_user_id: recipientUserId,
          notice_kind: kind,
          notice_title: title,
          notice_body: body,
          notice_href: href ?? null,
          notice_team_id: teamId ?? null,
          notice_team_match_id: teamMatchId ?? null,
          notice_season_id: seasonId ?? null,
          actor_user_id: actorUserId ?? null,
        }),
      });
      return { id: result };
    },
  };
}
