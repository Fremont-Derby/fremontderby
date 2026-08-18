import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_DNS_HOSTS } from '../scripts/assert-production-dns.mjs';
import { CANARY_HOSTS } from '../scripts/public-surface-contract.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('PRODUCTION_DNS_HOSTS are the production hosts from the host map', () => {
  const productionHosts = Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)
    .filter(([, env]) => env === 'production')
    .map(([host]) => host)
    .sort();
  assert.deepEqual([...PRODUCTION_DNS_HOSTS].sort(), productionHosts);
});

test('CANARY_HOSTS expectEnv matches HOST_ENVIRONMENT_EXPECTATIONS', () => {
  for (const row of CANARY_HOSTS) {
    const hostname = new URL(row.base).hostname;
    assert.equal(
      HOST_ENVIRONMENT_EXPECTATIONS[hostname],
      row.expectEnv,
      `${row.name} ${hostname}`,
    );
  }
});

test('CANARY_HOSTS covers every HOST_ENVIRONMENT host', () => {
  const canaryHostnames = new Set(CANARY_HOSTS.map((row) => new URL(row.base).hostname));
  for (const host of Object.keys(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.ok(canaryHostnames.has(host), host);
  }
});
