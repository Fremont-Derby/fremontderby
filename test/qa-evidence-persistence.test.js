import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createQaEvidenceHttp } from '../src/qaEvidenceHttp.js';
import { createQaEvidenceRepository } from '../src/qaEvidenceRepository.js';

const SHA = 'b794a527bacb1347ecb89b1dd2931e1c787c8240';
const env = {
  ENVIRONMENT: 'jfl',
  SUPABASE_SCHEMA: 'jfl',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key',
  CF_VERSION_METADATA: { id: 'worker-version', tag: SHA },
};

function evidence(overrides = {}) {
  return {
    schema_version: '1.0.0', lane: 'jfl', run_id: 'run-1', replay_of_run_id: null,
    level_id: 'scorecard.fresh', seed: 'seed-1', build_sha: SHA, worker_version: SHA,
    started_at: '2026-09-10T10:00:00.000Z', completed_at: '2026-09-10T10:01:00.000Z', duration_ms: 60000,
    tester_id: 'opaque-tester', session_id: null,
    device: { browser_family: 'chrome', device_family: 'android', viewport_width: 412, viewport_height: 915 },
    fixture_facts: { world: 'scorecard', race_state: 'fresh' },
    assertions: [{ assertion_id: 'scorecard.fresh.0', result: 'pass', answered_at: '2026-09-10T10:01:00.000Z' }],
    outcome: 'pass', note: null,
    events: [{ event_id: 'event-1', type: 'interaction', action: 'save_result', component: 'qa_assertions', occurred_at: '2026-09-10T10:01:00.000Z', sequence: 0 }],
    ...overrides,
  };
}

test('repository writes only to JFL private schema and verifies idempotent retries', async () => {
  const stored = evidence();
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'POST') return new Response(null, { status: 201 });
    return Response.json([{ payload: stored }]);
  };
  const repository = createQaEvidenceRepository(env, { fetch });
  assert.deepEqual(await repository.persistRun(stored), stored);
  assert.deepEqual(await repository.persistRun(stored), stored);
  assert.equal(calls.filter((call) => call.options.method === 'POST').length, 2);
  for (const call of calls) {
    assert.equal(call.options.headers['accept-profile'], 'jfl_private');
    assert.equal(call.options.headers['content-profile'], 'jfl_private');
    assert.doesNotMatch(call.url, /production|dru|gamma/);
  }
  assert.match(calls[0].options.headers.prefer, /resolution=ignore-duplicates/);
});

test('repository detects an immutable run ID collision and supports indexed retrieval filters', async () => {
  const original = evidence();
  const fetch = async (url, options = {}) => {
    if (options.method === 'POST') return new Response(null, { status: 201 });
    if (url.includes('run_id=eq.')) return Response.json([{ payload: { ...original, outcome: 'fail' } }]);
    return Response.json([{ payload: original }]);
  };
  const repository = createQaEvidenceRepository(env, { fetch });
  await assert.rejects(repository.persistRun(original), /different immutable evidence/);
  const runs = await repository.listRuns({ buildSha: SHA, levelId: 'scorecard.fresh', seed: 'seed-1' });
  assert.equal(runs[0].run_id, 'run-1');
});

test('repository fails closed for every non-JFL runtime', () => {
  for (const environment of ['production', 'dru', 'gamma', 'staging', undefined]) {
    assert.throws(() => createQaEvidenceRepository({ ...env, ENVIRONMENT: environment }), /only in the JFL/);
  }
  assert.throws(() => createQaEvidenceRepository({ ...env, SUPABASE_SCHEMA: 'public' }), /only in the JFL/);
});

test('HTTP ingest validates exact deployed SHA and delegates one immutable envelope', async () => {
  const saved = [];
  const route = createQaEvidenceHttp({ createRepository: () => ({ persistRun: async (row) => { saved.push(row); return row; } }) });
  const request = new Request('https://jfl.example/api/qa/evidence', { method: 'POST', body: JSON.stringify(evidence()) });
  const response = await route(request, env);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { saved: true, runId: 'run-1' });
  assert.equal(saved.length, 1);

  const stale = await route(new Request('https://jfl.example/api/qa/evidence', { method: 'POST', body: JSON.stringify(evidence({ build_sha: 'a'.repeat(40) })) }), env);
  assert.equal(stale.status, 409);
  assert.equal(await route(new Request('https://jfl.example/api/qa/evidence'), { ...env, ENVIRONMENT: 'production', SUPABASE_SCHEMA: 'public' }), null);
});

test('migration creates an RLS-forced private JFL table with service-role-only grants and retrieval index', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20260910115000_jfl_qa_evidence_runs.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists jfl_private\.qa_evidence_runs/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /force row level security/);
  assert.match(sql, /revoke all .* from public, anon, authenticated/);
  assert.match(sql, /grant select, insert .* to service_role/);
  assert.match(sql, /build_sha, level_id, seed, created_at desc/);
  assert.doesNotMatch(sql, /\b(public|dru|gamma|production)_private\.qa_evidence_runs/);
});

