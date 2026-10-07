import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resetJflTwoCaptainFixture as resetFixture, upcomingFixtureDate, waitForExactJflHealth } from '../scripts/reset-jfl-two-captain.mjs';

function readiness(options) {
  let elapsed = 0;
  return waitForExactJflHealth({ ...options, clock: () => elapsed,
    sleep: async (ms) => { elapsed += ms; }, timeoutMs: 60_000 });
}

function resetJflTwoCaptainFixture(options) {
  return resetFixture({ ...options, waitForHealth: readiness });
}

const migration = await readFile(new URL('../supabase/migrations/20261002172005_jfl_two_captain_reset_rpc.sql', import.meta.url), 'utf8');
const fixtureId = '18580000-1300-4000-8000-000000000001';
const seasonId = '18580000-1000-4000-8000-000000000000';
const roundId = '18580000-1200-4000-8000-000000000001';

function fixtureFetch(calls, overrides = {}) {
  let scheduledOn = '2026-10-09';
  return async (url, options = {}) => {
    calls.push({ url, options });
    const path = new URL(url).pathname;
    if (overrides[path]) return overrides[path](url, options);
    if (path === '/health/environment') {
      return Response.json({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: 'sha' });
    }
    if (path.endsWith('/reset_two_captain_qa')) {
      return Response.json([{ team_match_id: fixtureId, reset_lineups: 1 }]);
    }
    if (path.endsWith('/seasons')) return Response.json([{ id: seasonId, purpose: 'qa' }]);
    assert.equal(path, '/rest/v1/rounds');
    const query = new URL(url).searchParams;
    assert.equal(query.get('id'), `eq.${roundId}`);
    assert.equal(query.get('season_id'), `eq.${seasonId}`);
    assert.equal(query.get('stage'), 'eq.regular');
    assert.equal(query.get('round_number'), 'eq.1');
    assert.equal(options.headers['accept-profile'], 'jfl');
    assert.equal(options.headers['content-profile'], 'jfl');
    if (options.method === 'PATCH') {
      const body = JSON.parse(options.body);
      assert.deepEqual(Object.keys(body), ['scheduled_on']);
      scheduledOn = body.scheduled_on;
    }
    return Response.json([{ id: roundId, season_id: seasonId, scheduled_on: scheduledOn }]);
  };
}

test('JFL reset RPC is invoker-rights, fixture-scoped, and service-role-only', () => {
  assert.match(migration, /security invoker/i);
  assert.match(migration, /s\.purpose = 'qa'/i);
  assert.match(migration, /raise exception 'The exact JFL two-captain QA matchup is required'/i);
  assert.match(migration, /revoke all on function jfl\.reset_two_captain_qa\(\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function jfl\.reset_two_captain_qa\(\) to service_role/i);
  assert.match(migration, new RegExp(fixtureId));
  assert.doesNotMatch(migration, /\b(public|private|dru|gamma)\./i);
});

test('hosted preflight checks exact live SHA before reset and never exposes the key in errors', async () => {
  const calls = [];
  const fetchImpl = fixtureFetch(calls);
  const result = await resetJflTwoCaptainFixture({ fetchImpl, serviceRoleKey: 'test-secret', expectedSha: 'sha', now: '2026-10-03T00:00:00Z' });
  assert.equal(result.resetLineups, 1);
  assert.equal(result.scheduledOn, '2026-10-10');
  assert.equal(calls.length, 8);
  assert.match(calls[2].url, /oqkkvqkerusepyokzbmt\.supabase\.co\/rest\/v1\/rpc\/reset_two_captain_qa$/);
  assert.equal(calls[2].options.headers['content-profile'], 'jfl');

  await assert.rejects(
    resetJflTwoCaptainFixture({ fetchImpl: async () => ({ ok: false, status: 403 }), serviceRoleKey: 'test-secret', expectedSha: 'sha' }),
    (error) => !error.message.includes('test-secret'),
  );
});

test('alternating old/exact deployment resets readiness streak before any mutation', async () => {
  const calls = [];
  const versions = ['old', 'sha', 'old', 'sha', 'sha', 'sha'];
  const phases = [];
  await resetJflTwoCaptainFixture({
    fetchImpl: fixtureFetch(calls, { '/health/environment': () => Response.json({
      environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: versions.shift(),
    }) }), serviceRoleKey: 'test-secret', expectedSha: 'sha', onPhase: (phase) => phases.push(phase),
  });
  assert.equal(calls.findIndex(({ options }) => options.method === 'POST'), 5);
  assert.equal(calls.filter(({ options }) => options.method === 'POST').length, 1);
  assert.equal(versions.length, 0);
  assert.match(phases[0], /pre-reset-health; mutationState=not-started/);
  assert.match(phases.at(-1), /complete; mutationState=reset-and-date-confirmed/);
});

test('readiness timeout performs zero mutations and reports pre-reset state', async () => {
  const calls = [];
  await assert.rejects(resetJflTwoCaptainFixture({
    fetchImpl: fixtureFetch(calls, { '/health/environment': () => Response.json({
      environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: 'old',
    }) }), serviceRoleKey: 'test-secret', expectedSha: 'sha',
  }), /phase=pre-reset-health; mutationState=not-started: Exact JFL deployment did not stabilize/);
  assert.equal(calls.length, 5);
  assert.ok(calls.every(({ options }) => !options.method));
});

test('wrong environment/schema/readiness fails immediately without writes', async () => {
  for (const invalid of [{ environment: 'dru' }, { expectedSupabaseSchema: 'public' }, { ok: false }]) {
    const calls = [];
    await assert.rejects(resetJflTwoCaptainFixture({
      fetchImpl: fixtureFetch(calls, { '/health/environment': () => Response.json({
        environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: 'sha', ...invalid,
      }) }), serviceRoleKey: 'test-secret', expectedSha: 'sha',
    }), /phase=pre-reset-health; mutationState=not-started: JFL health failed/);
    assert.equal(calls.length, 1);
  }
});

test('post-reset identity change fails without retrying writes and reports confirmed date', async () => {
  const calls = [];
  let reads = 0;
  await assert.rejects(resetJflTwoCaptainFixture({
    fetchImpl: fixtureFetch(calls, { '/health/environment': () => Response.json({
      environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true,
      versionTag: ++reads <= 2 ? 'sha' : 'old',
    }) }), serviceRoleKey: 'test-secret', expectedSha: 'sha',
  }), /phase=post-reset-health; mutationState=reset-and-date-confirmed: The live JFL environment is not the requested exact SHA/);
  assert.equal(reads, 3);
  assert.equal(calls.filter(({ options }) => options.method === 'POST').length, 1);
  assert.equal(calls.filter(({ options }) => options.method === 'PATCH').length, 1);
});

test('transport failures identify uncertain mutation outcome without exposing private error text', async () => {
  for (const [path, phase, state] of [
    ['/health/environment', 'pre-reset-health', 'not-started'],
    ['/rest/v1/rpc/reset_two_captain_qa', 'reset-rpc', 'reset-outcome-unknown'],
    ['/rest/v1/rounds', 'fixture-date', 'reset-confirmed-date-unconfirmed'],
  ]) {
    const calls = [];
    await assert.rejects(resetJflTwoCaptainFixture({
      fetchImpl: fixtureFetch(calls, { [path]: () => { throw new Error('private test-secret response'); } }),
      serviceRoleKey: 'test-secret', expectedSha: 'sha',
    }), (error) => {
      assert.equal(error.message, `JFL QA reset failed phase=${phase}; mutationState=${state}: Request or response validation failed`);
      return true;
    });
    assert.ok(calls.filter(({ options }) => options.method === 'POST').length <= 1);
  }
});

test('fixture date uses UTC calendar arithmetic across midnight, year, leap day and DST', () => {
  for (const [clock, expected] of [
    ['2026-12-28T23:59:59-08:00', '2027-01-05'],
    ['2028-02-25T00:00:00Z', '2028-03-03'],
    ['2026-03-08T01:59:59-08:00', '2026-03-15'],
    ['2026-11-01T01:59:59-07:00', '2026-11-08'],
    ['2026-10-03T00:00:00Z', '2026-10-10'],
    ['2026-10-03T23:59:59Z', '2026-10-10'],
  ]) assert.equal(upcomingFixtureDate(clock), expected);
  assert.throws(() => upcomingFixtureDate('invalid'), /valid fixture clock/);
});

test('date refresh fails closed before calendar writes on wrong purpose or missing round', async () => {
  for (const [path, rows] of [
    ['/rest/v1/seasons', [{ id: seasonId, purpose: 'league' }]],
    ['/rest/v1/seasons', [{ id: 'other', purpose: 'qa' }]],
    ['/rest/v1/rounds', []],
    ['/rest/v1/rounds', [{ id: roundId, season_id: 'other' }]],
  ]) {
    const calls = [];
    await assert.rejects(resetJflTwoCaptainFixture({
      fetchImpl: fixtureFetch(calls, { [path]: () => Response.json(rows) }),
      serviceRoleKey: 'test-secret', expectedSha: 'sha',
    }), /fixed JFL QA (?:season|round) is required/);
    assert.ok(calls.every(({ options }) => options.method !== 'PATCH'));
  }
});

test('reset rejects a date write whose persisted value differs', async () => {
  let reads = 0;
  const calls = [];
  await assert.rejects(resetJflTwoCaptainFixture({
    fetchImpl: fixtureFetch(calls, {
      '/rest/v1/rounds': (_url, options) => {
        if (options.method !== 'PATCH') reads += 1;
        return Response.json([{ id: roundId, season_id: seasonId,
          scheduled_on: options.method === 'PATCH' ? '2026-10-10' : '2026-10-09' }]);
      },
    }), serviceRoleKey: 'test-secret', expectedSha: 'sha', now: '2026-10-03T00:00:00Z',
  }), /date did not persist/);
  assert.equal(reads, 2);
});

test('same-day trusted resets replay safely with the same date and bounded mutations', async () => {
  const calls = [];
  const fetchImpl = fixtureFetch(calls);
  for (const now of ['2026-10-03T00:00:00Z', '2026-10-03T23:59:59Z']) {
    const result = await resetJflTwoCaptainFixture({ fetchImpl, serviceRoleKey: 'test-secret', expectedSha: 'sha', now });
    assert.equal(result.scheduledOn, '2026-10-10');
  }
  assert.equal(calls.filter(({ options }) => options.method === 'PATCH').length, 2);
  assert.ok(calls.filter(({ options }) => options.method === 'PATCH').every(({ options }) =>
    options.body === '{"scheduled_on":"2026-10-10"}'));
});
