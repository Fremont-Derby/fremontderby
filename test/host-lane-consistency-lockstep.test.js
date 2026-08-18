import test from 'node:test';
import assert from 'node:assert/strict';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('every LANE_CUSTOM_DOMAINS hostname is in HOST_ENVIRONMENT_EXPECTATIONS', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(HOST_ENVIRONMENT_EXPECTATIONS, row.hostname),
      `missing host expectation for ${row.hostname}`,
    );
    assert.equal(
      HOST_ENVIRONMENT_EXPECTATIONS[row.hostname],
      row.env,
      `env mismatch for ${row.hostname}`,
    );
  }
});

test('HOST_ENVIRONMENT_EXPECTATIONS hosts match LANE_CUSTOM_DOMAINS set', () => {
  const laneHosts = new Set(LANE_CUSTOM_DOMAINS.map((r) => r.hostname));
  const envHosts = new Set(Object.keys(HOST_ENVIRONMENT_EXPECTATIONS));
  assert.deepEqual([...envHosts].sort(), [...laneHosts].sort());
});
