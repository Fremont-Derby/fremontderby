import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_DNS_HOSTS } from '../scripts/assert-production-dns.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('PRODUCTION_DNS_HOSTS matches production HOST_ENVIRONMENT hosts', () => {
  const expected = Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)
    .filter(([, env]) => env === 'production')
    .map(([host]) => host)
    .sort();
  assert.deepEqual([...PRODUCTION_DNS_HOSTS].sort(), expected);
});

test('PRODUCTION_DNS_HOSTS has unique hosts', () => {
  assert.equal(PRODUCTION_DNS_HOSTS.length, new Set(PRODUCTION_DNS_HOSTS).size);
});
