import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('diagnose expected hosts match LANE_CUSTOM_DOMAINS hostnames', () => {
  const diagnoseHosts = [...EXPECTED_WORKER_DOMAIN_BINDINGS.keys()].sort();
  const domainHosts = LANE_CUSTOM_DOMAINS.map((row) => row.hostname).sort();
  assert.deepEqual(diagnoseHosts, domainHosts);
});

test('diagnose allowlist includes the restore/service name for each host', () => {
  for (const row of LANE_CUSTOM_DOMAINS) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname);
    assert.ok(Array.isArray(allowed), row.hostname);
    assert.ok(allowed.includes(row.service), `${row.hostname} must allow ${row.service}`);
  }
});

test('production apex allowlist includes legacy fremontderby-prod', () => {
  const apex = EXPECTED_WORKER_DOMAIN_BINDINGS.get('fremontderby.com');
  assert.ok(apex.includes('fremontderby'));
  assert.ok(apex.includes('fremontderby-prod'));
});
