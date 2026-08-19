import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCloudflareBuildContext,
  resolveBuildLane,
  branchAllowedForLane,
} from '../scripts/guard-cloudflare-build.mjs';
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';

test('resolveBuildLane rejects unknown lanes', () => {
  assert.throws(
    () => resolveBuildLane({ FREMONT_BUILD_LANE: 'staging' }),
    /unknown FREMONT_BUILD_LANE "staging"/,
  );
  assert.throws(
    () => resolveBuildLane({ FREMONT_BUILD_LANE: 'beta' }),
    /unknown FREMONT_BUILD_LANE/,
  );
  assert.equal(resolveBuildLane({}), 'production');
  assert.equal(resolveBuildLane({ FREMONT_BUILD_LANE: 'GAMMA' }), 'gamma');
});

test('assertCloudflareBuildContext refuses dependabot and renovate on every lane', () => {
  for (const lane of ['production', 'jfl', 'dru', 'gamma']) {
    for (const branch of ['dependabot/npm_and_yarn/x', 'renovate/lodash-1.x']) {
      assert.throws(
        () => assertCloudflareBuildContext({
          WORKERS_CI: '1',
          WORKERS_CI_BRANCH: branch,
          FREMONT_BUILD_LANE: lane,
        }),
        /Refusing Cloudflare/,
      );
      assert.equal(branchAllowedForLane(branch, lane), false);
    }
  }
});

test('assertCloudflareBuildContext refuses unknown explicit lane argument', () => {
  assert.throws(
    () => assertCloudflareBuildContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
    }, 'not-a-lane'),
    /unknown FREMONT_BUILD_LANE "not-a-lane"/,
  );
});

test('stripTrailingSlashes removes only trailing slashes without regex backtracking', () => {
  assert.equal(stripTrailingSlashes('https://x.test/'), 'https://x.test');
  assert.equal(stripTrailingSlashes('https://x.test///'), 'https://x.test');
  assert.equal(stripTrailingSlashes('/path/'), '/path');
  assert.equal(stripTrailingSlashes('noslash'), 'noslash');
  assert.equal(stripTrailingSlashes(''), '');
  assert.equal(stripTrailingSlashes(null), '');
});
