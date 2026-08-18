import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCloudflareBuildContext } from '../scripts/guard-cloudflare-build.mjs';

test('assertCloudflareBuildContext is no-op outside WORKERS_CI', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({}));
});

test('assertCloudflareBuildContext refuses PR events under WORKERS_CI', () => {
  assert.throws(
    () =>
      assertCloudflareBuildContext({
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: 'main',
        WORKERS_CI_EVENT: 'pull_request',
        FREMONT_BUILD_LANE: 'production',
      }),
    /pull_request event/,
  );
});

test('assertCloudflareBuildContext accepts main for production under WORKERS_CI', () => {
  assert.doesNotThrow(() =>
    assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      FREMONT_BUILD_LANE: 'production',
    }),
  );
});
