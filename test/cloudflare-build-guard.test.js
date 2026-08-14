import test from 'node:test';
import assert from 'node:assert/strict';

import { assertCloudflareBuildContext } from '../scripts/guard-cloudflare-build.mjs';

test('Cloudflare Workers Builds allow only the JFL deployment branch', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'fremontderby-jfl',
  }));
});

test('Cloudflare Workers Builds reject every other branch before Wrangler runs', () => {
  for (const branch of ['main', 'feature/example', 'jfl/issue-606-worker-build']) {
    assert.throws(
      () => assertCloudflareBuildContext({
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: branch,
      }),
      /Refusing JFL Cloudflare build/,
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
