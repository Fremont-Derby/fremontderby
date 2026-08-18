import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('LANE_CUSTOM_DOMAINS env matches HOST_ENVIRONMENT_EXPECTATIONS', () => {
  assert.equal(LANE_CUSTOM_DOMAINS.length, Object.keys(HOST_ENVIRONMENT_EXPECTATIONS).length);
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.equal(HOST_ENVIRONMENT_EXPECTATIONS[row.hostname], row.env, row.hostname);
  }
});

test('LANE_CUSTOM_DOMAINS service naming convention', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    if (row.env === 'production') {
      assert.equal(row.service, 'fremontderby');
    } else {
      assert.equal(row.service, `fremontderby-${row.env}`);
    }
  }
});

test('every HOST_ENVIRONMENT host appears in LANE_CUSTOM_DOMAINS', () => {
  const hosts = new Set(LANE_CUSTOM_DOMAINS.map((row) => row.hostname));
  for (const host of Object.keys(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.ok(hosts.has(host), host);
  }
});
