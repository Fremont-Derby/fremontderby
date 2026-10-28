import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { waitForJflWorkersBuild } from '../scripts/wait-jfl-workers-build.mjs';

const sha = 'a'.repeat(40), build = '36580000-1000-4000-8000-000000000001';
const env = { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/fremontderby-jfl',
  GITHUB_REF_NAME: 'fremontderby-jfl', GITHUB_REPOSITORY: 'Fremont-Derby/fremontderby',
  GITHUB_ACTOR: 'subiki', GITHUB_SHA: sha, GITHUB_TOKEN: 'synthetic-secret' };
const check = overrides => ({ id: 123, name: 'Workers Builds: fremontderby-jfl',
  app: { slug: 'cloudflare-workers-and-pages' }, head_sha: sha, external_id: build,
  details_url: 'https://dash.cloudflare.com/' + 'b'.repeat(32) + '/workers/services/view/fremontderby-jfl/production/builds/' + build,
  status: 'completed', conclusion: 'success', ...overrides });
const response = (checks, status = 200, retry = null) => ({ status,
  headers: { get: () => retry }, json: async () => ({ total_count: checks.length, check_runs: checks }) });
async function run(responses, options = {}) {
  let time = 0; const calls = []; const waits = [];
  const result = await waitForJflWorkersBuild({ env, now: () => time, timeoutMs: 10_000, pollMs: 1000,
    sleep: async ms => { waits.push(ms); time += ms; },
    fetchImpl: async (url, init) => { calls.push({ url, init }); return responses[Math.min(calls.length - 1, responses.length - 1)]; }, ...options });
  return { result, calls, waits };
}

test('waits for a discovered current-SHA Build to complete before authorizing the final tagged deploy', async () => {
  const { result, calls, waits } = await run([response([]), response([check({ status: 'in_progress', conclusion: null })]), response([check()])]);
  assert.deepEqual(result, { sha, buildId: build, checkId: 123 });
  assert.deepEqual(waits, [1000, 1000]);
  assert.equal(new URL(calls[0].url).hostname, 'api.github.com');
  assert.equal(new URL(calls[0].url).searchParams.get('filter'), 'latest');
  assert.equal(new URL(calls[0].url).searchParams.get('check_name'), 'Workers Builds: fremontderby-jfl');
  assert.equal(calls[0].init.headers.authorization, 'Bearer synthetic-secret');
});

test('other lanes, PRs, foreign repos, untrusted actors and credential-forwarding hosts fail before any request', async () => {
  for (const override of [{ GITHUB_REF: 'refs/heads/fremontderby-dru' }, { GITHUB_REF_NAME: 'fremontderby-gamma' },
    { GITHUB_REF: 'refs/heads/main' }, { GITHUB_EVENT_NAME: 'pull_request' }, { GITHUB_REPOSITORY: 'other/repo' },
    { GITHUB_ACTOR: 'outsider' }, { GITHUB_API_URL: 'https://untrusted.test' }, { GITHUB_TOKEN: '' }, { GITHUB_SHA: 'short' }]) {
    let called = false;
    await assert.rejects(run([], { env: { ...env, ...override }, fetchImpl: async () => { called = true; } }));
    assert.equal(called, false);
  }
});

test('wrong worker, app, SHA, build URL and ambiguous checks cannot authorize deployment', async () => {
  for (const override of [{ name: 'Workers Builds: fremontderby-dru' }, { app: { slug: 'untrusted' } },
    { head_sha: 'c'.repeat(40) }, { external_id: 'wrong-id' }, { details_url: 'https://untrusted.test/' },
    { details_url: check().details_url.replace('fremontderby-jfl', 'fremontderby-dru') },
    { details_url: check().details_url + '?other=true' }, { id: null }]) {
    await assert.rejects(run([response([check(override)])]), /Publisher check does not bind|Invalid publisher identity/);
  }
  await assert.rejects(run([response([check(), check({ id: 124 })])]), /one latest/);
});

test('failed, cancelled, skipped and malformed publisher records fail closed', async () => {
  for (const conclusion of ['failure', 'cancelled', 'skipped', 'neutral', 'timed_out', null]) {
    await assert.rejects(run([response([check({ conclusion })])]), /did not complete successfully/);
  }
  await assert.rejects(run([{ status: 200, json: async () => ({}) }]), /incomplete or ambiguous/);
  await assert.rejects(run([{ status: 200, json: async () => { throw new Error('synthetic-secret'); } }]), /Invalid publisher check JSON/);
});

test('API authentication and network failures are not retried or exposed in diagnostics', async () => {
  for (const status of [401, 403, 404, 500]) await assert.rejects(run([response([], status)]), new RegExp('HTTP' + status));
  await assert.rejects(run([], { fetchImpl: async () => { throw new Error('synthetic-secret'); } }), error => {
    assert.ok(!error.message.includes('synthetic-secret')); return /Could not read/.test(error.message);
  });
});

test('only validated API throttling permits a wait; header duration is honored without changing identity', async () => {
  const { calls, waits } = await run([response([], 429, '3'), response([check()])]);
  assert.deepEqual(waits, [3000]);
  assert.equal(calls[0].url, calls[1].url);
  assert.equal(calls[0].init.headers.authorization, calls[1].init.headers.authorization);
  for (const retry of [null, '0', '-1', 'bad', '99']) await assert.rejects(run([response([], 429, retry)]), /valid Retry-After/);
  const secondary = await run([response([], 403, '2'), response([check()])]);
  assert.deepEqual(secondary.waits, [2000]);
  const dated = await run([response([], 429, new Date(3000).toUTCString()), response([check()])]);
  assert.deepEqual(dated.waits, [3000]);
});

test('missing Build never silently allows a deploy and the bounded deadline cannot be widened', async () => {
  await assert.rejects(run([response([])]), /Timed out/);
  await assert.rejects(run([], { timeoutMs: 13 * 60_000 }), /bounded deployment window/);
});

test('workflow orders the JFL-only wait before the unchanged deployment command', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const wait = workflow.indexOf('node scripts/wait-jfl-workers-build.mjs');
  assert.ok(wait > 0 && wait < workflow.indexOf('npm run "deploy:${lane}"'));
  assert.match(workflow.slice(workflow.lastIndexOf('- name:', wait), wait), /if: github.ref == 'refs\/heads\/fremontderby-jfl'/);
});
