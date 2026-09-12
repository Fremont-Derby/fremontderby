import { validateQaEvidence } from './qaEvidenceContract.js';
import { createQaEvidenceRepository } from './qaEvidenceRepository.js';
import { routeQaEvidenceSummary } from './qaEvidenceSummaryHttp.js';

function response(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function deployedSha(env) {
  const value = env?.CF_VERSION_METADATA?.tag || env?.CF_VERSION_METADATA?.id || '';
  return /^[0-9a-f]{40}$/.test(value) ? value : null;
}

export function createQaEvidenceHttp({ createRepository = createQaEvidenceRepository } = {}) {
  return async function routeQaEvidence(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
    if (env?.ENVIRONMENT !== 'jfl' || env?.SUPABASE_SCHEMA !== 'jfl') return null;
    const url = new URL(request.url);
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

