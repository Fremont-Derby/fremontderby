import test from 'node:test';
import assert from 'node:assert/strict';

import { druProbePassed, recoverDruLane } from '../scripts/recover-dru-lane.mjs';

function jsonResponse(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

test('probe pass requires HTTP 200, environment=dru, and isolated staging project', () => {
  assert.equal(druProbePassed({
    status: 503,
    ok: false,
    environment: 'dru',
  }), false);
  assert.equal(druProbePassed({
    status: 200,
    ok: true,
    environment: 'dru',
    schema: 'dru',
    projectRef: 'oqkkvqkerusepyokzbmt',
  }), true);
  assert.equal(druProbePassed({
    status: 200,
    ok: true,
    environment: 'production',
  }), false);
});

test('recover clears secrets and does not deploy unless RECOVER_DRU_DEPLOY=1', async () => {
  let deployed = 0;
  const outcome = await recoverDruLane({
    env: {
      CLOUDFLARE_ACCOUNT_ID: 'acct',
      CLOUDFLARE_API_TOKEN: 'token',
    },
    deploy: () => {
      deployed += 1;
    },
    fetchImpl: async (url, options) => {
      if (String(url).includes('/health/environment')) {
        return jsonResponse(503, { ok: false, environment: 'dru' });
      }
      if (options?.method === 'GET') {
        return jsonResponse(200, { success: true, result: [] });
      }
      return jsonResponse(404, { success: false, errors: [{ message: 'absent' }] });
    },
  });
  assert.equal(deployed, 0);
  assert.equal(outcome.deployed, false);
  assert.equal(outcome.healthy, false);
  assert.equal(outcome.probe.status, 503);
});

test('recover deploys when RECOVER_DRU_DEPLOY=1 and reports a green probe', async () => {
  const deployEnvs = [];
  const outcome = await recoverDruLane({
    env: {
      CLOUDFLARE_ACCOUNT_ID: 'acct',
      CLOUDFLARE_API_TOKEN: 'token',
      RECOVER_DRU_DEPLOY: '1',
    },
    deploy: (lane, options) => {
      deployEnvs.push({ lane, allow: options.env.FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN });
    },
    fetchImpl: async (url, options) => {
      if (String(url).includes('/health/environment')) {
        return jsonResponse(200, {
          ok: true,
          environment: 'dru',
          expectedSupabaseSchema: 'dru',
          checks: [{ name: 'supabaseProjectMatchesEnvironment', projectRef: 'oqkkvqkerusepyokzbmt' }],
        });
      }
      if (options?.method === 'GET') {
        return jsonResponse(200, { success: true, result: [] });
      }
      return jsonResponse(200, { success: true, result: {} });
    },
  });
  assert.deepEqual(deployEnvs, [{ lane: 'dru', allow: '1' }]);
  assert.equal(outcome.deployed, true);
  assert.equal(outcome.healthy, true);
});
