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

test('checkReleaseOnce requires Try a League Night on /demo', async () => {
  const sha = 'abc1234';
  const fetchImpl = async (url) => {
    if (String(url).endsWith('/health')) {
      return jsonResponse({ service: 'fremontderby', ok: true, versionTag: sha });
    }
    if (String(url).endsWith('/health/environment')) {
      return jsonResponse({
        service: 'fremontderby',
        environment: 'production',
        ok: true,
        versionTag: sha,
      });
    }
    return {
      ok: true,
      status: 200,
      text: async () => '<html>wrong surface</html>',
    };
  };
  await assert.rejects(
    () =>
      checkReleaseOnce({
        baseUrl: 'https://fremontderby.com',
        expectedEnvironment: 'production',
        expectedVersionTag: sha,
        fetchImpl,
      }),
    /unexpected release surface/,
  );
});
