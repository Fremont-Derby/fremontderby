import test from 'node:test';
import assert from 'node:assert/strict';
import { disableWorkerSubdomain } from '../scripts/disable-workers-dev.mjs';

test('disableWorkerSubdomain treats 404 as absent', async () => {
  const fetchImpl = async () => ({
    status: 404,
    ok: false,
    json: async () => ({ success: false }),
  });
  const result = await disableWorkerSubdomain({
    accountId: 'acct',
    apiToken: 'token',
    scriptName: 'fremontderby-dru',
    fetchImpl,
  });
  assert.equal(result.status, 'absent');
});

test('disableWorkerSubdomain confirms disabled modes', async () => {
  const fetchImpl = async () => ({
    status: 200,
    ok: true,
    json: async () => ({ success: true, result: { enabled: false, previews_enabled: false } }),
  });
  const result = await disableWorkerSubdomain({
    accountId: 'acct',
    apiToken: 'token',
    scriptName: 'fremontderby',
    fetchImpl,
  });
  assert.equal(result.status, 'disabled');
});
