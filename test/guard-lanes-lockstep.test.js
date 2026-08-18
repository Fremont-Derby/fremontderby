import assert from 'node:assert/strict';
import test from 'node:test';
import { LANE_BRANCH_ALLOWLISTS } from '../scripts/guard-cloudflare-build.mjs';
import { laneDeployments } from '../scripts/deploy-lane.mjs';

test('guard allowlists cover production plus every deploy lane', () => {
  const expected = new Set(['production', ...Object.keys(laneDeployments)]);
  assert.deepEqual(new Set(Object.keys(LANE_BRANCH_ALLOWLISTS)), expected);
});

test('non-prod allowlists include permanent branch fremontderby-<lane>', () => {
  for (const lane of Object.keys(laneDeployments)) {
    const patterns = LANE_BRANCH_ALLOWLISTS[lane];
    assert.ok(patterns, lane);
    const permanent = `fremontderby-${lane}`;
    assert.ok(
      patterns.some((re) => re.test(permanent)),
      `${lane} allowlist must match ${permanent}`,
    );
  }
});

test('production allowlist is main-only', () => {
  const patterns = LANE_BRANCH_ALLOWLISTS.production;
  assert.ok(patterns.some((re) => re.test('main')));
  assert.ok(!patterns.some((re) => re.test('fremontderby-dru')));
  assert.ok(!patterns.some((re) => re.test('dru/feature')));
});

test('laneDeployments branch matches permanent branch convention', () => {
  for (const [lane, config] of Object.entries(laneDeployments)) {
    assert.equal(config.branch, `fremontderby-${lane}`);
    assert.equal(config.environment, lane);
  }
});
