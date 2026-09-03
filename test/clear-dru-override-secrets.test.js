import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  DRU_OVERRIDE_SECRET_NAMES,
  DRU_PRESERVE_SECRET_NAMES,
  DRU_WORKER_SCRIPT_NAME,
  assertSafeDeleteTarget,
  clearDruOverrideSecrets,
  deleteWorkerSecret,
  listWorkerSecrets,
  secretsUrl,
} from '../scripts/clear-dru-override-secrets.mjs';

function jsonResponse(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => payload,
  };
}

test('clearance targets only the three DRU override secret names', () => {
  assert.deepEqual([...DRU_OVERRIDE_SECRET_NAMES], [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ]);
  assert.deepEqual([...DRU_PRESERVE_SECRET_NAMES], [
    'SUPABASE_SERVICE_ROLE_KEY',
    'BETA_ACTOR_USER_ID',
  ]);
  assert.equal(DRU_WORKER_SCRIPT_NAME, 'fremontderby-dru');
});

test('delete URL is scoped to the dru Worker and encoded secret name', () => {
  assert.equal(
    secretsUrl({
      accountId: 'acct',
      scriptName: 'fremontderby-dru',
      secretName: 'SUPABASE_URL',
    }),
    'https://api.cloudflare.com/client/v4/accounts/acct/workers/scripts/fremontderby-dru/secrets/SUPABASE_URL',
  );
});

test('refuses production, JFL, and preserved secret names before any request', () => {
  assert.throws(
    () => assertSafeDeleteTarget({ scriptName: 'fremontderby', secretName: 'SUPABASE_URL' }),
    /only fremontderby-dru/,
  );
  assert.throws(
    () => assertSafeDeleteTarget({ scriptName: 'fremontderby-jfl', secretName: 'SUPABASE_URL' }),
    /only fremontderby-dru/,
  );
  assert.throws(
    () => assertSafeDeleteTarget({
      scriptName: 'fremontderby-dru',
      secretName: 'SUPABASE_SERVICE_ROLE_KEY',
    }),
    /preserved DRU secret/,
  );
  assert.throws(
    () => assertSafeDeleteTarget({
      scriptName: 'fremontderby-dru',
      secretName: 'BETA_ACTOR_USER_ID',
    }),
    /preserved DRU secret/,
  );
});

test('missing credentials fail closed without calling Cloudflare', async () => {
  let called = false;
  await assert.rejects(
    clearDruOverrideSecrets({
      accountId: '',
      apiToken: 'token',
      fetchImpl: async () => {
        called = true;
      },
    }),
    /CLOUDFLARE_ACCOUNT_ID is required/,
  );
  assert.equal(called, false);
});

test('deletes listed override secrets and treats 404 as already clear', async () => {
  const calls = [];
  const listed = {
    first: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'BETA_ACTOR_USER_ID'],
    second: ['SUPABASE_SERVICE_ROLE_KEY', 'BETA_ACTOR_USER_ID'],
  };
  let listCount = 0;

  const outcome = await clearDruOverrideSecrets({
    accountId: 'acct',
    apiToken: 'token',
    fetchImpl: async (url, options) => {
      calls.push({ url, method: options.method });
      if (options.method === 'GET') {
        listCount += 1;
        const names = listCount === 1 ? listed.first : listed.second;
        return jsonResponse(200, {
          success: true,
          result: names.map((name) => ({ name, type: 'secret_text' })),
        });
      }
      if (url.endsWith('/SUPABASE_URL')) {
        return jsonResponse(200, { success: true, result: {} });
      }
      if (url.endsWith('/SUPABASE_PUBLISHABLE_KEY') || url.endsWith('/EXPECTED_SUPABASE_PROJECT_REF')) {
        return jsonResponse(404, {
          success: false,
          errors: [{ message: 'Secret not found' }],
        });
      }
      throw new Error(`unexpected ${options.method} ${url}`);
    },
  });

  assert.deepEqual(outcome.results.map((row) => `${row.secretName}:${row.status}`), [
    'SUPABASE_URL:deleted',
    'SUPABASE_PUBLISHABLE_KEY:absent',
    'EXPECTED_SUPABASE_PROJECT_REF:absent',
  ]);
  assert.deepEqual([...outcome.remainingSecrets], [
    'SUPABASE_SERVICE_ROLE_KEY',
    'BETA_ACTOR_USER_ID',
  ]);
  assert.equal(calls.filter((call) => call.method === 'DELETE').length, 1);
});

test('fails closed when an override secret remains after delete', async () => {
  await assert.rejects(
    clearDruOverrideSecrets({
      accountId: 'acct',
      apiToken: 'token',
      fetchImpl: async (url, options) => {
        if (options.method === 'GET') {
          return jsonResponse(200, {
            success: true,
            result: [{ name: 'SUPABASE_URL', type: 'secret_text' }],
          });
        }
        return jsonResponse(200, { success: true, result: {} });
      },
    }),
    /Override secrets still present/,
  );
});

test('single delete refuses a non-dru Worker even with a listed name', async () => {
  let called = false;
  await assert.rejects(
    deleteWorkerSecret({
      accountId: 'acct',
      apiToken: 'token',
      scriptName: 'fremontderby-gamma',
      secretName: 'SUPABASE_URL',
      fetchImpl: async () => {
        called = true;
      },
    }),
    /only fremontderby-dru/,
  );
  assert.equal(called, false);
});

test('list refuses a non-dru Worker', async () => {
  await assert.rejects(
    listWorkerSecrets({
      accountId: 'acct',
      apiToken: 'token',
      scriptName: 'fremontderby',
      fetchImpl: async () => {
        throw new Error('should not fetch');
      },
    }),
    /only fremontderby-dru/,
  );
});

test('workflow is dispatch-only and does not deploy', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/clear-dru-override-secrets.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /npm run deploy/);
  assert.doesNotMatch(workflow, /wrangler deploy/);
  assert.match(workflow, /scripts\/clear-dru-override-secrets\.mjs/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
});
