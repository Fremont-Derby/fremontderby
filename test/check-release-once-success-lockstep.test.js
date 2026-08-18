import test from 'node:test';
import assert from 'node:assert/strict';
import { checkReleaseOnce } from '../scripts/smoke-release.mjs';

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    text: async () => JSON.stringify(body),
  };
}

test('checkReleaseOnce passes when health environment and demo align', async () => {
  const sha = 'deadbeefcafebabe';
  const fetchImpl = async (url) => {
    if (String(url).endsWith('/health')) {
      return jsonResponse({
        service: 'fremontderby',
        ok: true,
        versionTag: sha,
        version: '1',
        deployedAt: '2026-01-01T00:00:00Z',
      });
    }
    if (String(url).endsWith('/health/environment')) {
      return jsonResponse({
        service: 'fremontderby',
        environment: 'production',
        ok: true,
        versionTag: sha,
        checks: [],
      });
    }
    return {
      ok: true,
      status: 200,
      text: async () => '<html>Try a League Night</html>',
    };
  };
  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: sha,
    fetchImpl,
  });
  assert.equal(result.ready, true);
  assert.equal(result.versionTag, sha);
  assert.equal(result.environment, 'production');
});
