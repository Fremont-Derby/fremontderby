import test from 'node:test';
import assert from 'node:assert/strict';
import { checkReleaseOnce } from '../scripts/smoke-release.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('release smoke treats null versionTag as untagged / not ready', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/health')) {
      return json({ ok: true, service: 'fremontderby', version: 'worker-version', versionTag: null });
    }
    if (url.endsWith('/health/environment')) {
      return json({
        ok: true,
        service: 'fremontderby',
        environment: 'production',
        versionTag: null,
        checks: [],
      });
    }
    if (url.endsWith('/demo')) {
      return new Response('<h1>Try a League Night</h1>', { status: 200 });
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: 'expected-sha',
    fetchImpl,
  });

  assert.equal(result.ready, false);
  assert.match(result.reason, /untagged|expected-sha/i);
  assert.equal(result.versionTag, null);
});

test('release smoke treats missing versionTag field as untagged / not ready', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/health')) {
      return json({ ok: true, service: 'fremontderby', version: 'worker-version' });
    }
    if (url.endsWith('/health/environment')) {
      return json({ ok: true, service: 'fremontderby', environment: 'production', checks: [] });
    }
    if (url.endsWith('/demo')) {
      return new Response('<h1>Try a League Night</h1>', { status: 200 });
    }
    throw new Error(`Unexpected URL ${url}`);
  };

  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: 'expected-sha',
    fetchImpl,
  });

  assert.equal(result.ready, false);
  assert.match(result.reason, /untagged|expected-sha/i);
});
