import { createAdminPlayersRepository } from './adminPlayersRepository.js';
import { createQaEvidenceRepository } from './qaEvidenceRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function clampLimit(url) {
  const parsed = Number.parseInt(url.searchParams.get('limit') || '20', 10);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(parsed, 1), 50);
}

function summarizeRuns(runs) {
  const outcomes = { pass: 0, fail: 0, incomplete: 0 };
  const levels = new Map();
  const assertions = new Map();

  for (const run of runs) {
    outcomes[run.outcome] = (outcomes[run.outcome] || 0) + 1;

    const level = levels.get(run.level_id) || {
      levelId: run.level_id,
      runs: 0,
      pass: 0,
      fail: 0,
      incomplete: 0,
    };
    level.runs += 1;
    level[run.outcome] = (level[run.outcome] || 0) + 1;
    levels.set(run.level_id, level);

    for (const item of run.assertions || []) {
      const aggregate = assertions.get(item.assertion_id) || {
        assertionId: item.assertion_id,
        pass: 0,
        fail: 0,
        notAnswered: 0,
      };
      if (item.result === 'not_answered') aggregate.notAnswered += 1;
      else aggregate[item.result] = (aggregate[item.result] || 0) + 1;
      assertions.set(item.assertion_id, aggregate);
    }
  }

  return {
    sampleSize: runs.length,
    latestCompletedAt: runs[0]?.completed_at || null,
    latestBuildSha: runs[0]?.build_sha || null,
    outcomes,
    levels: [...levels.values()],
    assertions: [...assertions.values()],
  };
}

function errorResponse(error) {
  if (error instanceof AuthError) return json({ error: error.message }, error.status);
  if (/league admin/i.test(error?.message || '')) {
    return json({ error: 'League admin access is required' }, 403);
  }
  return json({ error: 'QA survey summary could not be read' }, 503);
}

export function createQaEvidenceSummaryHttp({
  authenticateUser = authenticateSupabaseUser,
  createAdminRepository = createAdminPlayersRepository,
  createEvidenceRepository = createQaEvidenceRepository,
} = {}) {
  return async function routeQaEvidenceSummary(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
    if (env?.ENVIRONMENT !== 'jfl' || env?.SUPABASE_SCHEMA !== 'jfl') return null;

    const url = new URL(request.url);
    if (url.pathname !== '/api/admin/qa/evidence/summary') return null;
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    if (!request.headers.get('authorization')) return json({ error: 'Missing bearer token' }, 401);

    try {
      const actor = await authenticateUser(request, env, { fetch: fetchImpl });
      const adminRepository = createAdminRepository(env, { fetch: fetchImpl });
      await adminRepository.listPlayers({ actorUserId: actor.id });

      const evidenceRepository = createEvidenceRepository(env, { fetch: fetchImpl });
      const runs = await evidenceRepository.listRuns({ limit: clampLimit(url) });
      return json({ summary: summarizeRuns(runs) });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export const routeQaEvidenceSummary = createQaEvidenceSummaryHttp();
