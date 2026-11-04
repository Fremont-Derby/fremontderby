import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CLOUDFLARE_BUILD_BRANCHES,
  assertCloudflareBuildContext,
} from '../scripts/guard-cloudflare-build.mjs';
import {
  branchDeployments,
  resolveDeployTarget,
} from '../scripts/deploy-cloudflare.mjs';

const expectedTargets = Object.freeze({
  main: 'production',
  'fremontderby-jfl': 'jfl',
  'fremontderby-dru': 'dru',
  'fremontderby-gamma': 'gamma',
});

test('generic Cloudflare deploy maps each permanent branch to its own target', () => {
  assert.deepEqual(branchDeployments, expectedTargets);

  for (const [branch, target] of Object.entries(expectedTargets)) {
    assert.deepEqual(
      resolveDeployTarget({ WORKERS_CI: '1', WORKERS_CI_BRANCH: branch }),
      { branch, target },
    );
  }
});

test('generic Cloudflare deploy fails closed for feature and unknown branches', () => {
  for (const branch of ['jfl/issue-1216-workers-build', 'dru/example', 'feature/example']) {
    assert.throws(
      () => resolveDeployTarget({ WORKERS_CI: '1', WORKERS_CI_BRANCH: branch }),
      /Refusing Cloudflare deploy from unrecognized branch/,
    );
  }
});

test('generic Cloudflare deploy requires Workers Builds branch metadata', () => {
  assert.throws(
    () => resolveDeployTarget({ WORKERS_CI: '1' }),
    /Workers Builds did not provide WORKERS_CI_BRANCH/,
  );
});

test('Cloudflare prebuild accepts only permanent release branches', () => {
  assert.deepEqual(CLOUDFLARE_BUILD_BRANCHES, Object.keys(expectedTargets));

  for (const branch of CLOUDFLARE_BUILD_BRANCHES) {
    assert.doesNotThrow(() =>
      assertCloudflareBuildContext({ WORKERS_CI: '1', WORKERS_CI_BRANCH: branch }),
    );
  }

  assert.throws(
    () =>
      assertCloudflareBuildContext({
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: 'jfl/issue-1216-workers-build',
      }),
    /Refusing Cloudflare build from unrecognized branch/,
  );
});

test('Cloudflare prebuild remains a no-op outside Workers Builds', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({}));
});
