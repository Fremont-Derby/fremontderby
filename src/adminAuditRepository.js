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

export function createAdminAuditRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const supabaseUrl = requireEnv(env, 'SUPABASE_URL').replace(/\/$/, '');
  const serviceRoleKey = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'content-type': 'application/json',
  };

  return {
    async listAuditEvents({ actorUserId, limit = 50, actionPrefix = null }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/list_admin_audit_events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          result_limit: limit,
          action_prefix: actionPrefix,
        }),
      });
      return (Array.isArray(result) ? result : []).map((row) => ({
        id: row.id,
        actorUserId: row.event_actor_user_id ?? row.actor_user_id,
        actorDisplayName: row.actor_display_name,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        reason: row.reason,
        beforeState: row.before_state,
        afterState: row.after_state,
        createdAt: row.created_at,
      }));
    },

    async writeAuditEvent({
      actorUserId,
      action,
      entityType,
      entityId,
      reason = null,
      beforeState = null,
      afterState = null,
    }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/write_admin_audit_event`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          audit_action: action,
          audit_entity_type: entityType,
          audit_entity_id: entityId,
          audit_reason: reason,
          audit_before: beforeState,
          audit_after: afterState,
        }),
      });
      return { id: result };
    },

    async claimWebhookBatch({ actorUserId, batchSize = 25 }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/claim_audit_webhook_batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          batch_size: batchSize,
        }),
      });
      return (Array.isArray(result) ? result : []).map((row) => ({
        outboxId: row.outbox_id,
        auditEventId: row.audit_event_id,
        payload: row.payload,
        createdAt: row.created_at,
      }));
    },

    async markWebhookDelivered({ actorUserId, outboxId, error = null }) {
      await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/mark_audit_webhook_delivered`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_outbox_id: outboxId,
          delivery_error: error,
        }),
      });
      return { ok: true };
    },
  };
}

/** Best-effort POST to AUDIT_WEBHOOK_URL for near-real-time consumers. */
export async function deliverAuditWebhooks(env, actorUserId, {
  fetch: fetchImpl = globalThis.fetch,
  repository = createAdminAuditRepository(env, { fetch: fetchImpl }),
} = {}) {
  const webhookUrl = String(env?.AUDIT_WEBHOOK_URL || '').trim();
  if (!webhookUrl) {
    return { delivered: 0, skipped: true };
  }
  const batch = await repository.claimWebhookBatch({ actorUserId, batchSize: 25 });
  let delivered = 0;
  for (const item of batch) {
    try {
      const response = await fetchImpl(webhookUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-fremont-derby-audit': '1',
        },
        body: JSON.stringify({
          type: 'audit.event',
          ...item.payload,
        }),
      });
      if (!response.ok) {
        throw new Error(`Webhook HTTP ${response.status}`);
      }
      await repository.markWebhookDelivered({
        actorUserId,
        outboxId: item.outboxId,
      });
      delivered += 1;
    } catch (error) {
      await repository.markWebhookDelivered({
        actorUserId,
        outboxId: item.outboxId,
        error: error.message || 'delivery failed',
      });
    }
  }
  return { delivered, pending: batch.length - delivered };
}
