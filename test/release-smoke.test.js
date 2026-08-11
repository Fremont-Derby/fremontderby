import test from 'node:test';
import assert from 'node:assert/strict';

import { checkReleaseOnce, smokeRelease } from '../scripts/smoke-release.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function successfulFetch(versionTag = 'abc123') {
  return async (url) => {
    if (url.endsWith('/health')) {
      return json({ ok: true, service: 'fremontderby', version: 'worker-version', versionTag });
    }
    if (url.endsWith('/health/environment')) {
      return json({
        ok: true,
        service: 'fremontderby',
        environment: 'production',
        version: 'worker-version',
        versionTag,
        checks: [{ name: 'supabaseProjectMatchesEnvironment', ok: true }],
      });
    }
    if (url.endsWith('/demo')) {
      return new Response('<h1>Try a League Night</h1>', { status: 200 });
    }
    throw new Error(`Unexpected URL ${url}`);
  };
}

test('release smoke accepts the exact deployed Git tag and production environment', async () => {
  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com/',
    expectedEnvironment: 'production',
    expectedVersionTag: 'abc123',
    fetchImpl: successfulFetch('abc123'),
  });

  assert.equal(result.ready, true);
  assert.equal(result.versionTag, 'abc123');
  assert.equal(result.environment, 'production');
});

test('release smoke treats an older Worker tag as deployment still in progress', async () => {
  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: 'new-sha',
    fetchImpl: successfulFetch('old-sha'),
  });

  assert.equal(result.ready, false);
  assert.match(result.reason, /Waiting for Worker version tag new-sha/);
});

test('release smoke fails closed when the tagged deployment reports staging', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/health')) {
      return json({ ok: true, service: 'fremontderby', versionTag: 'abc123' });
    }
    if (url.endsWith('/health/environment')) {
      return json({ ok: true, service: 'fremontderby', environment: 'staging', versionTag: 'abc123' });
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  await assert.rejects(
    () => checkReleaseOnce({
      baseUrl: 'https://fremontderby.com',
      expectedEnvironment: 'production',
      expectedVersionTag: 'abc123',
      fetchImpl,
    }),
    /environment mismatch/i,
  );
});

test('release smoke retries old deployments and then accepts the target release', async () => {
  let attempts = 0;
  const result = await smokeRelease({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: 'target-sha',
    attempts: 3,
    delayMs: 0,
    sleep: async () => {},
    log: () => {},
    fetchImpl: async (url) => {
      const currentTag = attempts < 2 ? 'old-sha' : 'target-sha';
      if (url.endsWith('/health')) {
        attempts += 1;
        return json({ ok: true, service: 'fremontderby', version: 'worker-version', versionTag: currentTag });
      }
      if (url.endsWith('/health/environment')) {
        return json({ ok: true, service: 'fremontderby', environment: 'production', versionTag: currentTag, checks: [] });
      }
      if (url.endsWith('/demo')) {
        return new Response('Try a League Night', { status: 200 });
      }
      throw new Error(`Unexpected URL ${url}`);
    },
  });

  assert.equal(result.versionTag, 'target-sha');
  assert.equal(attempts, 3);
});
