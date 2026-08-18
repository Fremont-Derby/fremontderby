import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCloudflareBuildContext } from '../scripts/guard-cloudflare-build.mjs';

test('assertCloudflareBuildContext is no-op outside WORKERS_CI', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({}));
});

test('assertCloudflareBuildContext refuses pull_request events', () => {
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

test('assertCloudflareBuildContext refuses wrong branch for lane', () => {
  assert.throws(
    () =>
      assertCloudflareBuildContext({
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: 'feature/x',
        FREMONT_BUILD_LANE: 'dru',
      }),
    /Refusing Cloudflare dru build from branch/,
  );
});
