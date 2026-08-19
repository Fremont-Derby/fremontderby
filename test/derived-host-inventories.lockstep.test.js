import test from 'node:test';
import assert from 'node:assert/strict';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';
import { CANARY_HOSTS } from '../scripts/public-surface-contract.mjs';
import { PRODUCTION_DNS_HOSTS } from '../scripts/assert-production-dns.mjs';
import { LANE_HEALTH_CHECKS } from '../scripts/assert-lane-health.mjs';

test('CANARY_HOSTS is derived from HOST_ENVIRONMENT_EXPECTATIONS', () => {
  assert.equal(CANARY_HOSTS.length, Object.keys(HOST_ENVIRONMENT_EXPECTATIONS).length);
  for (const host of CANARY_HOSTS) {
    const hostname = host.base.replace(/^https:\/\//, '');
    assert.equal(host.expectEnv, HOST_ENVIRONMENT_EXPECTATIONS[hostname]);
    assert.equal(host.base, `https://${hostname}`);
  }
  const names = CANARY_HOSTS.map((h) => h.name);
  assert.ok(names.includes('production'));
  assert.ok(names.includes('www'));
  assert.ok(names.includes('jfl'));
  assert.ok(names.includes('dru'));
  assert.ok(names.includes('gamma'));
});

test('PRODUCTION_DNS_HOSTS is derived as production hosts only', () => {
  assert.deepEqual([...PRODUCTION_DNS_HOSTS], ['fremontderby.com', 'www.fremontderby.com']);
  for (const hostname of PRODUCTION_DNS_HOSTS) {
    assert.equal(HOST_ENVIRONMENT_EXPECTATIONS[hostname], 'production');
  }
});

test('LANE_HEALTH_CHECKS is derived 1:1 from HOST_ENVIRONMENT_EXPECTATIONS', () => {
  assert.equal(LANE_HEALTH_CHECKS.length, Object.keys(HOST_ENVIRONMENT_EXPECTATIONS).length);
  for (const check of LANE_HEALTH_CHECKS) {
    assert.equal(check.expect, HOST_ENVIRONMENT_EXPECTATIONS[check.host]);
  }
});
