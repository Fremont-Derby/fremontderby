import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBuildLane } from '../scripts/guard-cloudflare-build.mjs';

test('resolveBuildLane defaults to production', () => {
  assert.equal(resolveBuildLane({}), 'production');
});

test('resolveBuildLane reads FREMONT_BUILD_LANE', () => {
  assert.equal(resolveBuildLane({ FREMONT_BUILD_LANE: 'dru' }), 'dru');
  assert.equal(resolveBuildLane({ FREMONT_BUILD_LANE: 'JFL' }), 'jfl');
});

test('resolveBuildLane rejects unknown lanes', () => {
  assert.throws(() => resolveBuildLane({ FREMONT_BUILD_LANE: 'beta' }), /unknown FREMONT_BUILD_LANE/);
});
