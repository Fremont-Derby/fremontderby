import test from 'node:test';
import assert from 'node:assert/strict';
import { disableAllWorkerSubdomains } from '../scripts/disable-workers-dev.mjs';

test('disableAllWorkerSubdomains walks provided script names', async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(url);
    return {
      status: 404,
      ok: false,
      json: async () => ({ success: false }),
    };
  };
  const results = await disableAllWorkerSubdomains({
    accountId: 'acct',
    apiToken: 'token',
    scriptNames: ['fremontderby-dru', 'fremontderby-jfl'],
    fetchImpl,
  });
  assert.equal(results.length, 2);
  assert.equal(results[0].status, 'absent');
  assert.equal(results[1].scriptName, 'fremontderby-jfl');
  assert.equal(seen.length, 2);
});
