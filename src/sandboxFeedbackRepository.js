import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';
function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return stripTrailingSlashes(value);
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

export function createSandboxFeedbackRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  const baseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };

  async function rpc(name, body) {
    const response = await fetchImpl(`${baseUrl}/rest/v1/rpc/${name}`, {
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

  return {
    async submitSandboxFeedback({ actorUserId, surface, path, context, comment }) {
      const result = await rpc('submit_sandbox_feedback', {
        actor_user_id: actorUserId,
        feedback_surface: surface,
        feedback_path: path,
        feedback_context: context,
        feedback_comment: comment,
      });
      return Array.isArray(result) ? result[0] : result;
    },

    async listSandboxFeedback({ actorUserId, status, limit }) {
      return rpc('list_sandbox_feedback', {
        actor_user_id: actorUserId,
        status_filter: status === 'all' ? null : status,
        result_limit: limit,
      });
    },

    async resolveSandboxFeedback({ actorUserId, feedbackId }) {
      const result = await rpc('resolve_sandbox_feedback', {
        actor_user_id: actorUserId,
        target_feedback_id: feedbackId,
      });
      return Array.isArray(result) ? result[0] : result;
    },
  };
}
