import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedHostnamesForLane } from '../scripts/deploy-lane.mjs';

test('expectedHostnamesForLane returns domain hostnames per lane', () => {
  assert.deepEqual(expectedHostnamesForLane('dru'), ['dru.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('jfl'), ['jfl.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('gamma'), ['gamma.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('unknown'), []);
});
