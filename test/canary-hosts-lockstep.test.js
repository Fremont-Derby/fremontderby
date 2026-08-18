import test from 'node:test';
import assert from 'node:assert/strict';
import { CANARY_HOSTS } from '../scripts/public-surface-contract.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('CANARY_HOSTS is derived from every hostEnvironment host', () => {
  for (const [host, expect] of Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)) {
    const row = CANARY_HOSTS.find((item) => item.base === `https://${host}`);
    assert.ok(row, `missing canary host for ${host}`);
    assert.equal(row.expectEnv, expect, `${host} expectEnv mismatch`);
  }
});

test('every CANARY_HOST maps back to hostEnvironment', () => {
  for (const row of CANARY_HOSTS) {
    const host = row.base.replace(/^https:\/\//, '');
    assert.equal(
      HOST_ENVIRONMENT_EXPECTATIONS[host],
      row.expectEnv,
      `${row.name} (${host}) not aligned`,
    );
  }
});

test('CANARY_HOSTS count matches hostEnvironment entries', () => {
  assert.equal(CANARY_HOSTS.length, Object.keys(HOST_ENVIRONMENT_EXPECTATIONS).length);
});

test('www and production apex keep stable canary names', () => {
  const apex = CANARY_HOSTS.find((row) => row.base === 'https://fremontderby.com');
  const www = CANARY_HOSTS.find((row) => row.base === 'https://www.fremontderby.com');
  assert.equal(apex?.name, 'production');
  assert.equal(www?.name, 'www');
});
