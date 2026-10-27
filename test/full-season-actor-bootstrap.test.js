import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bootstrapFullSeasonActors } from '../scripts/bootstrap-jfl-full-season-actors.mjs';

const env = { GITHUB_REPOSITORY: 'Fremont-Derby/fremontderby', GITHUB_REF: 'refs/heads/fremontderby-jfl', GITHUB_ACTOR: 'subiki', GITHUB_JOB: 'reset-fixture', GITHUB_SHA: 'a'.repeat(40), SUPABASE_ACCESS_TOKEN: 'synthetic-server-secret' };
function fixture(responses = [[], [{ actor_count: 8 }]]) {
  const calls = [], phases = [];
  const fetchImpl = async (url, options) => {
    phases.push('query'); calls.push({ url, options });
    const value = responses.shift();
    if (value instanceof Error) throw value;
    if (value instanceof Response) return value;
    return Response.json(value, { status: 201 });
  };
  const waitForHealth = async ({ expectedSha }) => { phases.push('exact-health'); assert.equal(expectedSha, env.GITHUB_SHA); };
  return { calls, phases, options: { env, fetchImpl, waitForHealth, sql: 'synthetic guarded fixture SQL' } };
}

test('trusted bootstrap waits exact deployment, writes once to pinned staging and independently reads back eight mappings', async () => {
  const f = fixture();
  const result = await bootstrapFullSeasonActors(f.options);
  assert.equal(result.actorCount, 8);
  assert.deepEqual(f.phases, ['exact-health', 'query', 'query']);
  assert.equal(f.calls.length, 2);
  for (const call of f.calls) {
    assert.equal(call.url, 'https://api.supabase.com/v1/projects/oqkkvqkerusepyokzbmt/database/query');
    assert.equal(call.options.headers.authorization, 'Bearer synthetic-server-secret');
    assert.ok(call.options.signal instanceof AbortSignal);
  }
  assert.equal(JSON.parse(f.calls[0].options.body).read_only, false);
  assert.equal(JSON.parse(f.calls[1].options.body).read_only, true);
  assert.match(JSON.parse(f.calls[1].options.body).query, /auth\.identities/);
});

for (const [field, value] of Object.entries({ GITHUB_REPOSITORY: 'foreign/repo', GITHUB_REF: 'refs/heads/main', GITHUB_ACTOR: 'outside-author', GITHUB_JOB: 'browser', GITHUB_SHA: 'moving-ref', SUPABASE_ACCESS_TOKEN: '' })) {
  test(`bootstrap rejects invalid ${field} before health, SQL or secret use`, async () => {
    const f = fixture(); f.options.env = { ...env, [field]: value };
    await assert.rejects(bootstrapFullSeasonActors(f.options), /Refusing|credential is unavailable/);
    assert.deepEqual(f.phases, []);
  });
}

test('wrong live SHA stops before any Management API request', async () => {
  const f = fixture(); f.options.waitForHealth = async () => { throw new Error('wrong exact SHA'); };
  await assert.rejects(bootstrapFullSeasonActors(f.options), /preflight failed; no SQL attempted/);
  assert.equal(f.calls.length, 0);
});

for (const status of [401, 403, 429, 500]) test(`SQL HTTP${status} stops without replay or body disclosure`, async () => {
  const f = fixture([new Response('synthetic-private-provider-body', { status, headers: { 'Retry-After': '10' } })]);
  await assert.rejects(bootstrapFullSeasonActors(f.options), error => {
    assert.match(error.message, new RegExp(`HTTP ${status}`));
    assert.doesNotMatch(error.message, /synthetic-private-provider-body|synthetic-server-secret/);
    return true;
  });
  assert.equal(f.calls.length, 1);
});

for (const response of [new Error('synthetic-server-secret'), new Response('not-json', { status: 201 }), Response.json({ error: 'private-details' }, { status: 201 }), Response.json([{ error: 'private-details' }], { status: 201 })]) {
  test('unknown SQL outcome fails closed with sanitized diagnostics and no replay', async () => {
    const f = fixture([response]);
    await assert.rejects(bootstrapFullSeasonActors(f.options), error => {
      assert.doesNotMatch(error.message, /synthetic-server-secret|private-details|not-json/); return true;
    });
    assert.equal(f.calls.length, 1);
  });
}

test('failed independent count prevents persona enablement and never repeats the write', async () => {
  const f = fixture([[], [{ actor_count: 7 }]]);
  await assert.rejects(bootstrapFullSeasonActors(f.options), /readback failed/);
  assert.equal(f.calls.length, 2);
});

test('fixture bootstrap is serialized in trusted reset job and its credential never reaches browser', async () => {
  const workflow = await readFile(new URL('../.github/workflows/jfl-two-captain-browser.yml', import.meta.url), 'utf8');
  const reset = workflow.slice(workflow.indexOf('  reset-fixture:'), workflow.indexOf('\n  browser:'));
  const browser = workflow.slice(workflow.indexOf('\n  browser:'));
  assert.match(reset, /github\.actor == 'subiki'/);
  assert.match(reset, /runs-on: ubuntu-latest/);
  assert.match(reset, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.ok(reset.indexOf('bootstrap-jfl-full-season-actors.mjs') < reset.indexOf('run: node scripts/reset-jfl-two-captain.mjs'));
  assert.match(browser, /needs: reset-fixture/);
  assert.doesNotMatch(browser, /SUPABASE_ACCESS_TOKEN|SERVICE_ROLE_KEY|bootstrap-jfl-full-season/);
  assert.doesNotMatch(workflow, /pull_request:/);
});
