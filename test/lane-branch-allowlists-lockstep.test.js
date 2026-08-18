import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_BRANCH_ALLOWLISTS } from '../scripts/guard-cloudflare-build.mjs';

test('LANE_BRANCH_ALLOWLISTS covers production and permanent lanes', () => {
  assert.deepEqual(Object.keys(LANE_BRANCH_ALLOWLISTS).sort(), ['dru', 'gamma', 'jfl', 'production']);
  assert.ok(LANE_BRANCH_ALLOWLISTS.production.some((re) => re.test('main')));
  assert.ok(LANE_BRANCH_ALLOWLISTS.dru.some((re) => re.test('fremontderby-dru')));
  assert.ok(LANE_BRANCH_ALLOWLISTS.dru.some((re) => re.test('dru/issue-1')));
  assert.ok(LANE_BRANCH_ALLOWLISTS.jfl.some((re) => re.test('fremontderby-jfl')));
  assert.ok(LANE_BRANCH_ALLOWLISTS.gamma.some((re) => re.test('gamma/feature')));
});
