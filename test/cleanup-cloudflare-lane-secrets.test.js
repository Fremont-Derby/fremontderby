import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cleanupCloudflareLaneSecrets,
  obsoleteSecretBindingsByLane,
  selectObsoleteSecrets,
} from '../scripts/cleanup-cloudflare-lane-secrets.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const env = {
  CLOUDFLARE_ACCOUNT_ID: 'account-123',
  CLOUDFLARE_API_TOKEN: 'token-123',
};

test('JFL cleanup selects only obsolete public Supabase bindings that are actually present', () => {
  const names = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_URL',
    'UNRELATED_SECRET',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ];
  assert.deepEqual(selectObsoleteSecrets('jfl', names), [
    'SUPABASE_URL',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ]);
  assert.deepEqual(obsoleteSecretBindingsByLane.jfl, [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ]);
});

test('JFL cleanup lists names then deletes only obsolete bindings, never service role or unrelated secrets', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    if ((options.method || 'GET') === 'GET') {
      return jsonResponse({
        success: true,
        result: [
          { name: 'SUPABASE_SERVICE_ROLE_KEY', type: 'secret_text' },
          { name: 'SUPABASE_URL', type: 'secret_text' },
          { name: 'SUPABASE_PUBLISHABLE_KEY', type: 'secret_text' },
          { name: 'EXPECTED_SUPABASE_PROJECT_REF', type: 'secret_text' },
          { name: 'UNRELATED_SECRET', type: 'secret_text' },
        ],
      });
    }
    return jsonResponse({ success: true, result: {} });
  };

  const result = await cleanupCloudflareLaneSecrets('jfl', {
    env,
    fetchImpl,
    log: () => {},
  });

  assert.deepEqual(result.deleted, [
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'EXPECTED_SUPABASE_PROJECT_REF',
  ]);
  assert.equal(calls.length, 4);
  assert.match(calls[0].url, /\/workers\/scripts\/fremontderby-jfl\/secrets$/);
  assert.deepEqual(calls.slice(1).map((call) => call.method), ['DELETE', 'DELETE', 'DELETE']);
  assert.ok(calls.every((call) => !call.url.includes('SUPABASE_SERVICE_ROLE_KEY')));
  assert.ok(calls.every((call) => !call.url.includes('UNRELATED_SECRET')));
});

test('JFL cleanup is idempotent when obsolete secrets are already absent', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return jsonResponse({
      success: true,
      result: [{ name: 'SUPABASE_SERVICE_ROLE_KEY', type: 'secret_text' }],
    });
  };

  const result = await cleanupCloudflareLaneSecrets('jfl', {
    env,
    fetchImpl,
    log: () => {},
  });

  assert.deepEqual(result.deleted, []);
  assert.equal(calls, 1);
});

test('non-JFL lanes are a no-op and never call Cloudflare', async () => {
  for (const lane of ['dru', 'gamma', 'production']) {
    let called = false;
    const result = await cleanupCloudflareLaneSecrets(lane, {
      env: {},
      fetchImpl: async () => {
        called = true;
        throw new Error('must not be called');
      },
      log: () => {},
    });
    assert.deepEqual(result.deleted, []);
    assert.equal(called, false);
  }
});

test('JFL cleanup fails closed when Cloudflare cannot list secrets', async () => {
  await assert.rejects(
    cleanupCloudflareLaneSecrets('jfl', {
      env,
      fetchImpl: async () => jsonResponse({ success: false, errors: [{ message: 'denied' }] }, 403),
      log: () => {},
    }),
    /Could not list Cloudflare secrets for fremontderby-jfl/,
  );
});

test('JFL cleanup fails closed when deletion fails', async () => {
  let call = 0;
  await assert.rejects(
    cleanupCloudflareLaneSecrets('jfl', {
      env,
      fetchImpl: async () => {
        call += 1;
        if (call === 1) {
          return jsonResponse({ success: true, result: [{ name: 'SUPABASE_URL' }] });
        }
        return jsonResponse({ success: false, errors: [{ message: 'delete denied' }] }, 403);
      },
      log: () => {},
    }),
    /Could not delete obsolete JFL Cloudflare secret SUPABASE_URL/,
  );
});
