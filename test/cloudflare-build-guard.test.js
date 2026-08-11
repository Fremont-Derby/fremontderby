import test from 'node:test';
import assert from 'node:assert/strict';

import { assertCloudflareBuildContext } from '../scripts/guard-cloudflare-build.mjs';

test('Cloudflare Workers Builds allow the production main branch', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
  }));
});

test('Cloudflare Workers Builds reject non-main branches before Wrangler runs', () => {
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'feature/example',
    }),
    /Refusing Cloudflare build from non-main branch/,
  );
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
