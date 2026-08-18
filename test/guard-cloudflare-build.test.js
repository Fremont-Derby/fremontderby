import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANE_BRANCH_ALLOWLISTS,
  branchAllowedForLane,
  resolveBuildLane,
  assertCloudflareBuildContext,
} from '../scripts/guard-cloudflare-build.mjs';

test('resolveBuildLane defaults to production and rejects unknown lanes', () => {
  assert.equal(resolveBuildLane({}), 'production');
  assert.equal(resolveBuildLane({ FREMONT_BUILD_LANE: 'dru' }), 'dru');
  assert.throws(() => resolveBuildLane({ FREMONT_BUILD_LANE: 'beta' }), /unknown FREMONT_BUILD_LANE/);
});

test('branch allowlists cover permanent lanes and prefixes', () => {
  assert.ok(branchAllowedForLane('fremontderby-dru', 'dru'));
  assert.ok(branchAllowedForLane('dru/feature-x', 'dru'));
  assert.ok(branchAllowedForLane('fremontderby-jfl', 'jfl'));
  assert.ok(branchAllowedForLane('jfl/hotfix', 'jfl'));
  assert.ok(branchAllowedForLane('main', 'production'));
  assert.ok(branchAllowedForLane('fremontderby-gamma', 'gamma'));
  assert.equal(branchAllowedForLane('main', 'dru'), false);
  assert.equal(branchAllowedForLane('fremontderby-jfl', 'dru'), false);
});

test('global refuse patterns block PR and bot branches on every lane', () => {
  for (const lane of Object.keys(LANE_BRANCH_ALLOWLISTS)) {
    assert.equal(branchAllowedForLane('pull/123/head', lane), false);
    assert.equal(branchAllowedForLane('refs/pull/9/merge', lane), false);
    assert.equal(branchAllowedForLane('dependabot/npm_and_yarn/x', lane), false);
    assert.equal(branchAllowedForLane('renovate/something', lane), false);
  }
});

test('assertCloudflareBuildContext is a no-op outside Workers Builds', () => {
  assert.doesNotThrow(() => assertCloudflareBuildContext({ WORKERS_CI: '0' }));
  assert.doesNotThrow(() => assertCloudflareBuildContext({}));
});

test('assertCloudflareBuildContext refuses PR events and mismatched branches', () => {
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      FREMONT_BUILD_LANE: 'dru',
      WORKERS_CI_BRANCH: 'fremontderby-dru',
      WORKERS_CI_EVENT: 'pull_request',
    }),
    /pull_request/,
  );
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      FREMONT_BUILD_LANE: 'dru',
      WORKERS_CI_BRANCH: 'fremontderby-jfl',
    }),
    /Refusing Cloudflare dru build from branch/,
  );
  assert.doesNotThrow(() => assertCloudflareBuildContext({
    WORKERS_CI: '1',
    FREMONT_BUILD_LANE: 'dru',
    WORKERS_CI_BRANCH: 'fremontderby-dru',
  }));
});
