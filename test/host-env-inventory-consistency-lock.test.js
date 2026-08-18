/**
 * Higher-value pure architecture lock: HOST_ENVIRONMENT_EXPECTATIONS is the
 * canonical host→env map. Lane health, production DNS, and custom-domain
 * inventories must stay aligned with it (no drift, no orphan hosts).
 * Tracks #1245 / #1253 / #1255 / #1257 and Order 66 consolidation rule.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';
import { LANE_HEALTH_CHECKS } from '../scripts/assert-lane-health.mjs';
import { PRODUCTION_DNS_HOSTS } from '../scripts/assert-production-dns.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('HOST_ENVIRONMENT_EXPECTATIONS is non-empty frozen map of known public hosts', () => {
  assert.ok(HOST_ENVIRONMENT_EXPECTATIONS && typeof HOST_ENVIRONMENT_EXPECTATIONS === 'object');
  const hosts = Object.keys(HOST_ENVIRONMENT_EXPECTATIONS);
  assert.ok(hosts.length >= 5, 'expected at least production + lanes');
  for (const host of hosts) {
    assert.equal(typeof host, 'string');
    assert.ok(host.includes('fremontderby.com') || host === 'fremontderby.com');
    const env = HOST_ENVIRONMENT_EXPECTATIONS[host];
    assert.ok(['production', 'jfl', 'dru', 'gamma'].includes(env), `unexpected env ${env} for ${host}`);
  }
});

test('LANE_HEALTH_CHECKS covers every HOST_ENVIRONMENT_EXPECTATIONS host with matching expect', () => {
  const byHost = new Map(LANE_HEALTH_CHECKS.map((row) => [row.host, row.expect]));
  for (const [host, expect] of Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.ok(byHost.has(host), `LANE_HEALTH_CHECKS missing host ${host}`);
    assert.equal(byHost.get(host), expect, `LANE_HEALTH_CHECKS expect drift for ${host}`);
  }
  // No extra hosts outside the canonical map (prevents silent expansion)
  for (const row of LANE_HEALTH_CHECKS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(HOST_ENVIRONMENT_EXPECTATIONS, row.host),
      `LANE_HEALTH_CHECKS has host outside HOST_ENVIRONMENT_EXPECTATIONS: ${row.host}`,
    );
  }
});

test('PRODUCTION_DNS_HOSTS are exactly the production entries from HOST_ENVIRONMENT_EXPECTATIONS', () => {
  const productionHosts = Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)
    .filter(([, env]) => env === 'production')
    .map(([host]) => host)
    .sort();
  const dns = [...PRODUCTION_DNS_HOSTS].sort();
  assert.deepEqual(dns, productionHosts);
});

test('LANE_CUSTOM_DOMAINS hostnames and envs align with HOST_ENVIRONMENT_EXPECTATIONS', () => {
  const byHost = new Map(LANE_CUSTOM_DOMAINS.map((row) => [row.hostname, row.env]));
  for (const [host, expect] of Object.entries(HOST_ENVIRONMENT_EXPECTATIONS)) {
    assert.ok(byHost.has(host), `LANE_CUSTOM_DOMAINS missing hostname ${host}`);
    assert.equal(byHost.get(host), expect, `LANE_CUSTOM_DOMAINS env drift for ${host}`);
  }
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(HOST_ENVIRONMENT_EXPECTATIONS, row.hostname),
      `LANE_CUSTOM_DOMAINS has hostname outside HOST_ENVIRONMENT_EXPECTATIONS: ${row.hostname}`,
    );
  }
});
