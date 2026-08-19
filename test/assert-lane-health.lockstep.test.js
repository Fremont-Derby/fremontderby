import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANE_HEALTH_CHECKS,
  evaluateLaneHealthBody,
  probeLaneHealth,
  assertAllLaneHealth,
} from '../scripts/assert-lane-health.mjs';

test('LANE_HEALTH_CHECKS covers apex, www, and every lane host', () => {
  const byHost = Object.fromEntries(LANE_HEALTH_CHECKS.map((row) => [row.host, row.expect]));
  assert.equal(byHost['fremontderby.com'], 'production');
  assert.equal(byHost['www.fremontderby.com'], 'production');
  assert.equal(byHost['dru.fremontderby.com'], 'dru');
  assert.equal(byHost['jfl.fremontderby.com'], 'jfl');
  assert.equal(byHost['gamma.fremontderby.com'], 'gamma');
  assert.equal(Object.isFrozen(LANE_HEALTH_CHECKS), true);
});

test('evaluateLaneHealthBody fails closed on non-JSON, HTTP error, env mismatch, host mismatch', () => {
  assert.equal(
    evaluateLaneHealthBody('dru.fremontderby.com', 'dru', 200, 'not-json').ok,
    false,
  );

  const httpFail = evaluateLaneHealthBody(
    'jfl.fremontderby.com',
    'jfl',
    503,
    JSON.stringify({
      ok: false,
      environment: 'jfl',
      checks: [{ name: 'supabase', ok: false }],
      supabase: { projectRef: 'abc' },
    }),
  );
  assert.equal(httpFail.ok, false);
  assert.match(httpFail.error, /HTTP 503/);
  assert.match(httpFail.error, /failed=supabase/);

  const mismatch = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ ok: true, environment: 'production' }),
  );
  assert.equal(mismatch.ok, false);
  assert.match(mismatch.error, /expected="dru"/);

  const hostMismatch = evaluateLaneHealthBody(
    'gamma.fremontderby.com',
    'gamma',
    200,
    JSON.stringify({ ok: true, environment: 'gamma', hostMatchesEnvironment: false }),
  );
  assert.equal(hostMismatch.ok, false);
  assert.match(hostMismatch.error, /hostMatchesEnvironment=false/);
});

test('evaluateLaneHealthBody passes when identity and host match', () => {
  const ok = evaluateLaneHealthBody(
    'fremontderby.com',
    'production',
    200,
    JSON.stringify({ ok: true, environment: 'production', hostMatchesEnvironment: true }),
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.environment, 'production');
});

test('probeLaneHealth and assertAllLaneHealth use injected fetch', async () => {
  const row = await probeLaneHealth(
    { host: 'dru.fremontderby.com', expect: 'dru' },
    async (url) => {
      assert.equal(url, 'https://dru.fremontderby.com/health/environment');
      return new Response(JSON.stringify({ ok: true, environment: 'dru', hostMatchesEnvironment: true }), {
        status: 200,
      });
    },
  );
  assert.equal(row.ok, true);

  const summary = await assertAllLaneHealth(
    [
      { host: 'dru.fremontderby.com', expect: 'dru' },
      { host: 'jfl.fremontderby.com', expect: 'jfl' },
    ],
    async (url) => {
      if (url.includes('jfl')) {
        return new Response(JSON.stringify({ ok: true, environment: 'production' }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true, environment: 'dru' }), { status: 200 });
    },
  );
  assert.equal(summary.ok, false);
  assert.equal(summary.failed.length, 1);
  assert.equal(summary.failed[0].host, 'jfl.fremontderby.com');
});
