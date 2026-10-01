import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertCloudflareBuildContext,
  branchAllowedForLane,
  resolveBuildLane,
} from '../scripts/guard-cloudflare-build.mjs';

test('production Workers Builds allow main only', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
    FREMONT_BUILD_LANE: 'production',
  }));
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'jfl/issue-1-test',
      FREMONT_BUILD_LANE: 'production',
    }),
    /Refusing Cloudflare production build/,
  );
});

test('jfl Workers Builds allow jfl namespace and reject production branch names', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'jfl/issue-586-season-setup',
    FREMONT_BUILD_LANE: 'jfl',
  }));
  assert.doesNotThrow(() => assertCloudflareBuildContext({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'fremontderby-jfl',
    FREMONT_BUILD_LANE: 'jfl',
  }));
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      FREMONT_BUILD_LANE: 'jfl',
    }),
    /Refusing Cloudflare jfl build/,
  );
});

test('dru and gamma allowlists are namespaced', () => {
  assert.equal(branchAllowedForLane('dru/issue-1-x', 'dru'), true);
  assert.equal(branchAllowedForLane('gamma/issue-1-x', 'gamma'), true);
  assert.equal(branchAllowedForLane('jfl/issue-1-x', 'dru'), false);
  assert.equal(resolveBuildLane({ FREMONT_BUILD_LANE: 'DRU' }), 'dru');
});

test('Cloudflare Workers Builds fail closed when branch metadata is absent', () => {
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      FREMONT_BUILD_LANE: 'production',
    }),
    /did not provide WORKERS_CI_BRANCH/,
  );
});

test('ordinary local and GitHub CI builds remain allowed', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({}));
  assert.doesNotThrow(() => assertCloudflareBuildContext({ GITHUB_ACTIONS: 'true' }));
});

test('refuses pull-request style branches for every lane', () => {
  assert.equal(branchAllowedForLane('pull/123/head', 'production'), false);
  assert.equal(branchAllowedForLane('pull/123/head', 'jfl'), false);
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'pull/99/merge',
      FREMONT_BUILD_LANE: 'jfl',
    }),
    /Refusing Cloudflare jfl build/,
  );
});

test('refuses pull_request CI events even on an allowlisted branch name', () => {
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      FREMONT_BUILD_LANE: 'production',
      WORKERS_CI_EVENT: 'pull_request',
    }),
    /pull_request event/,
  );
});
