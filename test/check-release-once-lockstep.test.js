import test from 'node:test';
import assert from 'node:assert/strict';
import { checkReleaseOnce } from '../scripts/smoke-release.mjs';

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    text: async () => JSON.stringify(body),
  };
}

test('checkReleaseOnce waits when versionTag not yet live', async () => {
  const fetchImpl = async (url) => {
    if (String(url).endsWith('/health')) {
      return jsonResponse({ service: 'fremontderby', ok: true, versionTag: 'old' });
    }
    return jsonResponse({
      service: 'fremontderby',
      environment: 'production',
      ok: true,
      versionTag: 'old',
    });
  };
  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: 'newsha',
    fetchImpl,
  });
  assert.equal(result.ready, false);
  assert.match(result.reason, /Waiting for Worker version tag/);
});
