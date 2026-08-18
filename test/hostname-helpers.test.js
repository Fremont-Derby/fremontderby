import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedHostnamesForLane } from '../scripts/deploy-lane.mjs';
import { domainsForEnv } from '../scripts/lane-custom-domains.mjs';

test('expectedHostnamesForLane returns the dedicated lane host only', () => {
  assert.deepEqual(expectedHostnamesForLane('dru'), ['dru.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('jfl'), ['jfl.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('gamma'), ['gamma.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('unknown'), []);
});

test('domainsForEnv filters LANE_CUSTOM_DOMAINS by environment', () => {
  assert.deepEqual(
    domainsForEnv('production').map((row) => row.hostname).sort(),
    ['fremontderby.com', 'www.fremontderby.com'],
  );
  assert.equal(domainsForEnv('dru').length, 1);
  assert.equal(domainsForEnv('dru')[0].service, 'fremontderby-dru');
  assert.deepEqual(domainsForEnv('missing'), []);
});
