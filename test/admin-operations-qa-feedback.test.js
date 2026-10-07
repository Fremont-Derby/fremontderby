import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminOperationsRepository } from '../src/adminOperationsRepository.js';
import { buildAdminOperationsOverview } from '../src/adminOperationsHttp.js';

const env = { ENVIRONMENT: 'jfl', SUPABASE_SCHEMA: 'jfl', SUPABASE_URL: 'https://synthetic.test', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service' };
const actor = 'synthetic-admin';
const run = (outcome, result, date) => ({ outcome, level_id: 'synthetic-mission', completed_at: date,
  build_sha: 'synthetic-sha', assertions: [{ assertion_id: 'synthetic-check', result }],
  tester_id: 'PRIVATE_TESTER', session_id: 'PRIVATE_SESSION', notes: 'PRIVATE_NOTES', device: 'PRIVATE_DEVICE' });
function repository(options = {}) {
  const calls = [];
  const instance = createAdminOperationsRepository({ ...env, ...options.env }, { fetch: async (input, init) => {
    const url = new URL(input); calls.push({ url, init });
    if (url.pathname.endsWith('/rpc/list_chat_message_reports') && options.denied) return Response.json({ message: 'League admin access required' }, { status: 403 });
    if (url.pathname.endsWith('/qa_evidence_runs')) {
      if (options.failure) return Response.json({ message: 'PRIVATE_DATABASE_ERROR' }, { status: 503 });
      return Response.json((options.runs || []).map(payload => ({ payload })));
    }
    return Response.json([]);
  } });
  return { calls, get: () => instance.getOverview({ actorUserId: actor }) };
}
test('feedback projects private runs into aggregate outcomes and assertion counts', async () => {
  const repo = repository({ runs: [run('pass', 'pass', '2026-10-05'), run('fail', 'fail', '2026-10-04'), run('incomplete', 'not_answered', '2026-10-03')] });
  const raw = await repo.get();
  assert.deepEqual(raw.qaFeedback.outcomes, { pass: 1, fail: 1, incomplete: 1 });
  assert.deepEqual(raw.qaFeedback.assertions, [{ assertionId: 'synthetic-check', pass: 1, fail: 1, notAnswered: 1 }]);
  assert.equal(raw.qaFeedback.levels[0].runs, 3);
  assert.equal(raw.qaFeedback.latestCompletedAt, '2026-10-05');
  assert.equal(raw.qaFeedback.sampleSize, 3);
  const overview = buildAdminOperationsOverview(raw, { ok: true, environment: 'jfl' });
  assert.deepEqual(overview.qaFeedback, raw.qaFeedback);
  assert.doesNotMatch(JSON.stringify(overview.qaFeedback), /PRIVATE_|tester_id|session_id|notes|device/);
});
test('feedback query is newest first, bounded to 50, and uses private JFL projection', async () => {
  const repo = repository(); await repo.get();
  const call = repo.calls.find(c => c.url.pathname.endsWith('/qa_evidence_runs'));
  assert.equal(call.url.searchParams.get('order'), 'created_at.desc');
  assert.equal(call.url.searchParams.get('limit'), '50');
  assert.equal(call.url.searchParams.get('select'), 'payload');
  assert.equal(call.init.headers['accept-profile'], 'jfl_private');
  assert.equal(call.init.method, 'GET');
});
test('evidence read failure preserves operational metrics and suppresses database details', async () => {
  const raw = await repository({ failure: true }).get();
  assert.equal(raw.qaFeedback.available, false);
  assert.equal(raw.qaFeedback.sampleSize, 0);
  assert.deepEqual(raw.qaFeedback.outcomes, { pass: 0, fail: 0, incomplete: 0 });
  assert.equal(raw.metrics.profiles.available, true);
  assert.doesNotMatch(JSON.stringify(raw.qaFeedback), /PRIVATE_DATABASE_ERROR/);
});
test('confirmed empty evidence is available rather than a read failure', async () => {
  const raw = await repository().get();
  assert.equal(raw.qaFeedback.available, true); assert.equal(raw.qaFeedback.sampleSize, 0);
  assert.equal(raw.qaFeedback.latestCompletedAt, null);
});
for (const scope of [{ ENVIRONMENT: 'dru', SUPABASE_SCHEMA: 'dru' }, { ENVIRONMENT: 'production', SUPABASE_SCHEMA: 'public' }]) {
  test('feedback omitted outside qualified JFL scope ' + JSON.stringify(scope), async () => {
    const repo = repository({ env: scope }); const raw = await repo.get();
    assert.equal(raw.qaFeedback, null);
    assert.equal(repo.calls.some(c => c.url.pathname.endsWith('/qa_evidence_runs')), false);
  });
}
test('admin rejection occurs before reading feedback or any operational table', async () => {
  const repo = repository({ denied: true });
  await assert.rejects(repo.get(), /League admin access required/);
  assert.equal(repo.calls.length, 1);
  assert.equal(repo.calls[0].url.pathname.endsWith('/rpc/list_chat_message_reports'), true);
  assert.equal(JSON.parse(repo.calls[0].init.body).actor_user_id, actor);
});

test('mismatched JFL schema fails before repository access', () => {
  assert.throws(() => repository({ env: { SUPABASE_SCHEMA: 'public' } }), /does not match Worker environment/);
});
