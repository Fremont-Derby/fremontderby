import assert from 'node:assert/strict';
import test from 'node:test';
import { LANE_CUSTOM_DOMAINS, domainsForEnv } from '../scripts/lane-custom-domains.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

function expectedServiceForEnv(envName) {
  if (envName === 'production') return 'fremontderby';
  return `fremontderby-${envName}`;
}

test('LANE_CUSTOM_DOMAINS is derived from every hostEnvironment host', () => {
  for (const [host, expect] of Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)) {
    const row = LANE_CUSTOM_DOMAINS.find((item) => item.hostname === host);
    assert.ok(row, `missing domain row for ${host}`);
    assert.equal(row.env, expect);
    assert.equal(row.service, expectedServiceForEnv(expect));
  }
});

test('every LANE_CUSTOM_DOMAINS row maps back to hostEnvironment', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.equal(HOST_ENVIRONMENT_EXPECTATIONS[row.hostname], row.env);
  }
});

test('domainsForEnv returns only that environment\'s hostnames', () => {
  for (const envName of ['production', 'jfl', 'dru', 'gamma']) {
    const rows = domainsForEnv(envName);
    assert.ok(rows.length >= 1, envName);
    assert.ok(rows.every((row) => row.env === envName));
  }
});
