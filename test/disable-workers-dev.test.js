import test from 'node:test';
import assert from 'node:assert/strict';

import {
  disableAllWorkerSubdomains,
  disableWorkerSubdomain,
  workerScriptNames,
} from '../scripts/disable-workers-dev.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

function jsonResponse(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => payload,
  };
}

test('the cleanup owns every known Fremont Derby Worker name', () => {
  assert.deepEqual([...workerScriptNames], [
    'fremontderby',
    'fremontderby-prod',
    'fremontderby-staging',
    'fremontderby-jfl',
    'fremontderby-dru',
    'fremontderby-gamma',
  ]);
});

test('workerScriptNames covers every LANE_CUSTOM_DOMAINS service', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.ok(
      workerScriptNames.includes(row.service),
      `missing ${row.service} for ${row.hostname}`,
    );
  }
});

test('historical production/staging aliases remain in the cleanup list', () => {
  assert.ok(workerScriptNames.includes('fremontderby-prod'));
  assert.ok(workerScriptNames.includes('fremontderby-staging'));
});

test('cleanup deletes workers.dev and preview URLs for every Worker', async () => {
  const calls = [];
  const results = await disableAllWorkerSubdomains({
    accountId: 'account-id',
    apiToken: 'api-token',
    scriptNames: ['fremontderby-jfl', 'fremontderby-dru'],
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse(200, {
        success: true,
        result: { enabled: false, previews_enabled: false },
      });
    },
  });

  assert.deepEqual(results, [
    { scriptName: 'fremontderby-jfl', status: 'disabled' },
    { scriptName: 'fremontderby-dru', status: 'disabled' },
  ]);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.options.method, 'DELETE');
    assert.equal(call.options.headers.Authorization, 'Bearer api-token');
    assert.match(call.url, /^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/account-id\/workers\/scripts\//);
    assert.match(call.url, /\/subdomain$/);
  }
});

test('missing or retired Worker names are already safe', async () => {
  const result = await disableWorkerSubdomain({
    accountId: 'account-id',
    apiToken: 'api-token',
    scriptName: 'fremontderby-staging',
    fetchImpl: async () => jsonResponse(404, {
      success: false,
      errors: [{ message: 'Worker not found' }],
    }),
  });

  assert.deepEqual(result, {
    scriptName: 'fremontderby-staging',
    status: 'absent',
  });
});

test('cleanup fails before the API call when credentials are missing', async () => {
  let called = false;
  await assert.rejects(
    disableAllWorkerSubdomains({
      accountId: '',
      apiToken: 'api-token',
      fetchImpl: async () => {
        called = true;
      },
    }),
    /CLOUDFLARE_ACCOUNT_ID is required/,
  );
  assert.equal(called, false);
});

test('cleanup fails closed on Cloudflare API errors', async () => {
  await assert.rejects(
    disableWorkerSubdomain({
      accountId: 'account-id',
      apiToken: 'api-token',
      scriptName: 'fremontderby-jfl',
      fetchImpl: async () => jsonResponse(403, {
        success: false,
        errors: [{ message: 'Workers Scripts Write required' }],
      }),
    }),
    /fremontderby-jfl: Workers Scripts Write required/,
  );
});

test('cleanup rejects an ambiguous success response', async () => {
  await assert.rejects(
    disableWorkerSubdomain({
      accountId: 'account-id',
      apiToken: 'api-token',
      scriptName: 'fremontderby-dru',
      fetchImpl: async () => jsonResponse(200, {
        success: true,
        result: { enabled: false, previews_enabled: true },
      }),
    }),
    /did not confirm both workers\.dev modes disabled/,
  );
});
