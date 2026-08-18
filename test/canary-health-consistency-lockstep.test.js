import test from 'node:test';
import assert from 'node:assert/strict';
import { CANARY_HOSTS } from '../scripts/public-surface-contract.mjs';
import { LANE_HEALTH_CHECKS } from '../scripts/assert-lane-health.mjs';

test('every CANARY_HOSTS expectEnv has matching LANE_HEALTH_CHECKS entry', () => {
  const healthByHost = Object.fromEntries(LANE_HEALTH_CHECKS.map((c) => [c.host, c.expect]));
  for (const h of CANARY_HOSTS) {
    const hostFromBase = h.base.replace(/^https:\/\//, '');
    assert.equal(
      healthByHost[hostFromBase],
      h.expectEnv,
      `mismatch for ${hostFromBase}`,
    );
  }
});

test('LANE_HEALTH_CHECKS host set matches CANARY_HOSTS bases', () => {
  const healthHosts = LANE_HEALTH_CHECKS.map((c) => c.host).sort();
  const canaryHosts = CANARY_HOSTS.map((h) => h.base.replace(/^https:\/\//, '')).sort();
  assert.deepEqual(healthHosts, canaryHosts);
});
