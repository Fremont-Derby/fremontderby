import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('LANE_CUSTOM_DOMAINS env matches HOST_ENVIRONMENT_EXPECTATIONS', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.equal(
      HOST_ENVIRONMENT_EXPECTATIONS[row.hostname],
      row.env,
      row.hostname,
    );
  }
});

test('LANE_CUSTOM_DOMAINS covers every HOST_ENVIRONMENT hostname', () => {
  const covered = new Set(LANE_CUSTOM_DOMAINS.map((row) => row.hostname));
  for (const host of Object.keys(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.ok(covered.has(host), host);
  }
});

test('lane services follow fremontderby-<env> naming except production apex', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    if (row.env === 'production') {
      assert.equal(row.service, 'fremontderby');
    } else {
      assert.equal(row.service, `fremontderby-${row.env}`);
    }
  }
});
