import { validateQaEvidence } from './qaEvidenceContract.js';
import { createQaEvidenceRepository } from './qaEvidenceRepository.js';
import { createAdminPlayersRepository } from './adminPlayersRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

function response(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function deployedSha(env) {
  const value = env?.CF_VERSION_METADATA?.tag || env?.CF_VERSION_METADATA?.id || '';
  return /^[0-9a-f]{40}$/.test(value) ? value : null;
}

function recentLimit(url) {
  const parsed = Number.parseInt(url.searchParams.get('limit') || '20', 10);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(parsed, 1), 50);
}

function recentErrorResponse(error) {
  if (error instanceof AuthError) return response({ error: error.message }, error.status);
  if (/league admin/i.test(error?.message || '')) {
    return response({ error: 'League admin access is required' }, 403);
  }
  return response({ error: 'QA evidence could not be read' }, 503);
}

export function createQaEvidenceHttp({
  createRepository = createQaEvidenceRepository,
  createAdminRepository = createAdminPlayersRepository,
  authenticateUser = authenticateSupabaseUser,
} = {}) {
  return async function routeQaEvidence(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
    if (env?.ENVIRONMENT !== 'jfl' || env?.SUPABASE_SCHEMA !== 'jfl') return null;
    const url = new URL(request.url);

    if (url.pathname === '/api/qa/evidence/recent') {
      if (request.method !== 'GET') return response({ error: 'Method not allowed' }, 405);
      if (!request.headers.get('authorization')) return response({ error: 'Missing bearer token' }, 401);
      try {
        const actor = await authenticateUser(request, env, { fetch: fetchImpl });
        const adminRepository = createAdminRepository(env, { fetch: fetchImpl });
        await adminRepository.listPlayers({ actorUserId: actor.id });
        const repository = createRepository(env, { fetch: fetchImpl });
        const runs = await repository.listRuns({ limit: recentLimit(url) });
        return response({ runs, count: runs.length });
      } catch (error) {
        return recentErrorResponse(error);
      }
    }

    if (url.pathname !== '/api/qa/evidence') return null;
    if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
    try {
      const text = await request.text();
      if (text.length > 64_000) return response({ error: 'Evidence payload is too large' }, 413);
      const evidence = JSON.parse(text || '{}');
      const expectedSha = deployedSha(env);
      if (!expectedSha) return response({ error: 'Exact JFL build identity is unavailable' }, 503);
      if (evidence.build_sha !== expectedSha || evidence.worker_version !== expectedSha) {
        return response({ error: 'Evidence build identity does not match the deployed JFL Worker' }, 409);
      }
      const validation = validateQaEvidence(evidence);
      if (!validation.valid) return response({ error: 'Invalid QA evidence', details: validation.errors }, 400);
      const repository = createRepository(env, { fetch: fetchImpl });
      const stored = await repository.persistRun(evidence);
      return response({ saved: true, runId: stored.run_id }, 201);
    } catch (error) {
      if (error instanceof SyntaxError) return response({ error: 'Request body must be valid JSON' }, 400);
      if (/already exists/.test(error.message)) return response({ error: error.message }, 409);
      return response({ error: 'QA evidence could not be saved' }, 503);
    }
  };
}

export const routeQaEvidence = createQaEvidenceHttp();
