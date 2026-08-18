import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_HEALTH_CHECKS } from '../scripts/assert-lane-health.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('LANE_HEALTH_CHECKS covers every HOST_ENVIRONMENT_EXPECTATIONS host', () => {
  const byHost = new Map(LANE_HEALTH_CHECKS.map((row) => [row.host, row.expect]));
  for (const [host, expect] of Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.equal(byHost.get(host), expect, host);
  }
});

test('LANE_HEALTH_CHECKS has no hosts outside HOST_ENVIRONMENT_EXPECTATIONS', () => {
  for (const row of LANE_HEALTH_CHECKS) {
    assert.equal(
      HOST_ENVIRONMENT_EXPECTATIONS[row.host],
      row.expect,
      row.host,
    );
  }
});

test('LANE_HEALTH_CHECKS has unique hosts', () => {
  const hosts = LANE_HEALTH_CHECKS.map((row) => row.host);
  assert.equal(hosts.length, new Set(hosts).size);
});
