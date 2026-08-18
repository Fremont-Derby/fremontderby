import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCanaryHosts } from '../scripts/assert-public-surface.mjs';
import { CANARY_HOSTS } from '../scripts/public-surface-contract.mjs';

test('resolveCanaryHosts defaults to full CANARY_HOSTS', () => {
  const hosts = resolveCanaryHosts({});
  assert.equal(hosts.length, CANARY_HOSTS.length);
  assert.deepEqual(
    hosts.map((h) => h.name).sort(),
    CANARY_HOSTS.map((h) => h.name).sort(),
  );
});

test('resolveCanaryHosts filters by CANARY_ONLY names', () => {
  const hosts = resolveCanaryHosts({ CANARY_ONLY: 'production,www' });
  assert.deepEqual(
    hosts.map((h) => h.name).sort(),
    ['production', 'www'].sort(),
  );
});

test('resolveCanaryHosts prefers CANARY_HOSTS_JSON over CANARY_ONLY', () => {
  const custom = [{ name: 'custom', base: 'https://example.test', expectEnv: 'production' }];
  const hosts = resolveCanaryHosts({
    CANARY_HOSTS_JSON: JSON.stringify(custom),
    CANARY_ONLY: 'production',
  });
  assert.deepEqual(hosts, custom);
});

test('resolveCanaryHosts falls back when CANARY_HOSTS_JSON is invalid', () => {
  const hosts = resolveCanaryHosts({
    CANARY_HOSTS_JSON: '{not-json',
    CANARY_ONLY: 'dru',
  });
  assert.deepEqual(hosts.map((h) => h.name), ['dru']);
});
