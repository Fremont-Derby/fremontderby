import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_HEALTH_CHECKS } from '../scripts/assert-lane-health.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('LANE_HEALTH_CHECKS matches HOST_ENVIRONMENT_EXPECTATIONS', () => {
  assert.equal(LANE_HEALTH_CHECKS.length, Object.keys(HOST_ENVIRONMENT_EXPECTATIONS).length);
  for (const { host, expect } of LANE_HEALTH_CHECKS) {
    assert.equal(
      HOST_ENVIRONMENT_EXPECTATIONS[host],
      expect,
      host,
    );
  }
});

test('every HOST_ENVIRONMENT host appears in LANE_HEALTH_CHECKS', () => {
  const hosts = new Set(LANE_HEALTH_CHECKS.map((row) => row.host));
  for (const host of Object.keys(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.ok(hosts.has(host), host);
  }
});
