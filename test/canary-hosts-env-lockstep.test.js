import test from 'node:test';
import assert from 'node:assert/strict';
import { CANARY_HOSTS } from '../scripts/public-surface-contract.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

function hostnameFromBase(base) {
  return new URL(base).hostname;
}

test('CANARY_HOSTS expectEnv matches HOST_ENVIRONMENT_EXPECTATIONS', () => {
  for (const row of CANARY_HOSTS) {
    const host = hostnameFromBase(row.base);
    assert.equal(
      HOST_ENVIRONMENT_EXPECTATIONS[host],
      row.expectEnv,
      host,
    );
  }
});

test('CANARY_HOSTS covers every HOST_ENVIRONMENT_EXPECTATIONS hostname', () => {
  const covered = new Set(CANARY_HOSTS.map((row) => hostnameFromBase(row.base)));
  for (const host of Object.keys(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.ok(covered.has(host), host);
  }
});

test('CANARY_HOSTS names are unique', () => {
  const names = CANARY_HOSTS.map((row) => row.name);
  assert.equal(names.length, new Set(names).size);
});
