import test from 'node:test';
import assert from 'node:assert/strict';
import {
  workerScriptNames,
  disableWorkerSubdomain,
  disableAllWorkerSubdomains,
} from '../scripts/disable-workers-dev.mjs';

test('workerScriptNames covers production aliases and every lane Worker', () => {
  for (const name of [
    'fremontderby',
    'fremontderby-prod',
    'fremontderby-staging',
    'fremontderby-jfl',
    'fremontderby-dru',
    'fremontderby-gamma',
  ]) {
    assert.ok(workerScriptNames.includes(name), `missing ${name}`);
  }
  assert.equal(Object.isFrozen(workerScriptNames), true);
});

test('disableWorkerSubdomain requires account, token, and script name', async () => {
  await assert.rejects(
    () => disableWorkerSubdomain({ accountId: '', apiToken: 't', scriptName: 'fremontderby' }),
    /CLOUDFLARE_ACCOUNT_ID is required/,
  );
  await assert.rejects(
    () => disableWorkerSubdomain({ accountId: 'a', apiToken: '', scriptName: 'fremontderby' }),
    /CLOUDFLARE_API_TOKEN is required/,
  );
  await assert.rejects(
    () => disableWorkerSubdomain({ accountId: 'a', apiToken: 't', scriptName: '' }),
    /Worker script name is required/,
  );
});

test('disableWorkerSubdomain treats 404 as absent', async () => {
  const result = await disableWorkerSubdomain({
    accountId: 'acct',
    apiToken: 'token',
    scriptName: 'fremontderby-jfl',
    fetchImpl: async (url, init) => {
      assert.match(url, /workers\/scripts\/fremontderby-jfl\/subdomain$/);
      assert.equal(init.method, 'DELETE');
      assert.match(init.headers.Authorization, /^Bearer token$/);
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    },
  });
  assert.deepEqual(result, { scriptName: 'fremontderby-jfl', status: 'absent' });
});

test('disableWorkerSubdomain requires success + both modes disabled', async () => {
  const ok = await disableWorkerSubdomain({
    accountId: 'acct',
    apiToken: 'token',
    scriptName: 'fremontderby',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({ success: true, result: { enabled: false, previews_enabled: false } }),
        { status: 200 },
      ),
  });
  assert.deepEqual(ok, { scriptName: 'fremontderby', status: 'disabled' });

  await assert.rejects(
    () =>
      disableWorkerSubdomain({
        accountId: 'acct',
        apiToken: 'token',
        scriptName: 'fremontderby',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({ success: true, result: { enabled: true, previews_enabled: false } }),
            { status: 200 },
          ),
      }),
    /did not confirm both workers\.dev modes disabled/,
  );

  await assert.rejects(
    () =>
      disableWorkerSubdomain({
        accountId: 'acct',
        apiToken: 'token',
        scriptName: 'fremontderby',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({ success: false, errors: [{ message: 'nope' }] }),
            { status: 400 },
          ),
      }),
    /Could not disable workers\.dev for fremontderby: nope/,
  );
});

test('disableAllWorkerSubdomains walks the inventory in order', async () => {
  const seen = [];
  const results = await disableAllWorkerSubdomains({
    accountId: 'acct',
    apiToken: 'token',
    scriptNames: ['fremontderby-dru', 'fremontderby-gamma'],
    fetchImpl: async (url) => {
      const name = url.split('/').at(-2);
      seen.push(name);
      return new Response(JSON.stringify({ success: true, result: { enabled: false, previews_enabled: false } }), {
        status: 200,
      });
    },
  });
  assert.deepEqual(seen, ['fremontderby-dru', 'fremontderby-gamma']);
  assert.deepEqual(
    results.map((r) => r.status),
    ['disabled', 'disabled'],
  );
});
