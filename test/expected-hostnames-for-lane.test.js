import test from 'node:test';
import assert from 'node:assert/strict';
import {
  expectedHostnamesForLane,
  laneDeployments,
} from '../scripts/deploy-lane.mjs';
import { domainsForEnv } from '../scripts/lane-custom-domains.mjs';

for (const lane of Object.keys(laneDeployments)) {
  test(`expectedHostnamesForLane(${lane}) matches domainsForEnv`, () => {
    const envName = laneDeployments[lane].environment;
    assert.deepEqual(
      expectedHostnamesForLane(lane),
      domainsForEnv(envName).map((row) => row.hostname),
    );
  });
}

test('expectedHostnamesForLane returns empty for unknown lane', () => {
  assert.deepEqual(expectedHostnamesForLane('production'), []);
  assert.deepEqual(expectedHostnamesForLane(''), []);
});

test('lane hostnames are non-empty and lane-scoped', () => {
  for (const lane of Object.keys(laneDeployments)) {
    const hosts = expectedHostnamesForLane(lane);
    assert.ok(hosts.length > 0, lane);
    for (const host of hosts) {
      assert.match(host, new RegExp(`(^|\\.)${lane}\\.fremontderby\\.com$|^${lane}\\.`));
    }
  }
});
