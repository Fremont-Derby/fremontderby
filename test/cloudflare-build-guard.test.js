import test from 'node:test';
import assert from 'node:assert/strict';

import { assertCloudflareBuildContext } from '../scripts/guard-cloudflare-build.mjs';

const permanentReleaseBranches = [
  'main',
  'fremontderby-jfl',
  'fremontderby-dru',
  'fremontderby-gamma',
];

test('Cloudflare Workers Builds allow only permanent release branches', () => {
  for (const branch of permanentReleaseBranches) {
    assert.doesNotThrow(() => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: branch,
    }));
  }
});

test('Cloudflare Workers Builds reject feature and unknown branches before Wrangler runs', () => {
  for (const branch of ['feature/example', 'jfl/issue-606-worker-build', 'dru/issue-606-worker-build']) {
    assert.throws(
      () => assertCloudflareBuildContext({
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: branch,
      }),
      /Refusing Cloudflare build from unrecognized branch/,
    );
  }
});

test('Cloudflare Workers Builds fail closed when branch metadata is absent', () => {
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
    }),
    /did not provide WORKERS_CI_BRANCH/,
  );
});

test('ordinary local and GitHub CI builds remain allowed', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({}));
  assert.doesNotThrow(() => assertCloudflareBuildContext({ GITHUB_ACTIONS: 'true' }));
});
