import { withSupabaseSchema } from './supabaseSchema.js';

function required(env, key) {
  if (!env?.[key]) throw new Error(`${key} is required`);
  return env[key];
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function sameEnvelope(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

async function body(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export function createQaEvidenceRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (env?.ENVIRONMENT !== 'jfl' || env?.SUPABASE_SCHEMA !== 'jfl') {
    throw new Error('QA evidence persistence is available only in the JFL environment');
  }
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const baseUrl = required(env, 'SUPABASE_URL').replace(/\/+$/, '');
  const key = required(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: 'application/json',
    'content-type': 'application/json',
    'accept-profile': 'private',
    'content-profile': 'private',
  };

  async function select(query) {
    const response = await fetchWithSchema(`${baseUrl}/rest/v1/qa_evidence_runs?${query}`, { headers });
    const result = await body(response);
    if (!response.ok) throw new Error(`QA evidence lookup failed with ${response.status}`);
    return Array.isArray(result) ? result.map((row) => row.payload) : [];
  }

  return {
    async getRunById(runId) {
      const rows = await select(`select=payload&run_id=eq.${encodeURIComponent(runId)}&limit=1`);
      return rows[0] || null;
    },

    async listRuns({ buildSha, levelId, seed, limit = 100 } = {}) {
      const filters = ['select=payload', 'order=created_at.desc', `limit=${Math.min(Math.max(Number(limit) || 100, 1), 500)}`];
      if (buildSha) filters.push(`build_sha=eq.${encodeURIComponent(buildSha)}`);
      if (levelId) filters.push(`level_id=eq.${encodeURIComponent(levelId)}`);
      if (seed) filters.push(`seed=eq.${encodeURIComponent(seed)}`);
      return select(filters.join('&'));
    },

    async persistRun(evidence) {
      const row = {
        run_id: evidence.run_id,
        schema_version: evidence.schema_version,
        level_id: evidence.level_id,
        seed: evidence.seed,
        build_sha: evidence.build_sha,
        replay_of_run_id: evidence.replay_of_run_id || null,
        outcome: evidence.outcome,
        completed_at: evidence.completed_at || null,
        payload: evidence,
      };
      const response = await fetchWithSchema(`${baseUrl}/rest/v1/qa_evidence_runs?on_conflict=run_id`, {
        method: 'POST',
        headers: { ...headers, prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(row),
      });
      if (!response.ok) throw new Error(`QA evidence save failed with ${response.status}`);
      const stored = await this.getRunById(evidence.run_id);
      if (!stored) throw new Error('QA evidence save could not be verified');
      if (!sameEnvelope(stored, evidence)) throw new Error('QA evidence run ID already exists with different immutable evidence');
      return stored;
    },
  };
}

