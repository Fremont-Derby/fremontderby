import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('EXPECTED_WORKER_DOMAIN_BINDINGS covers every LANE_CUSTOM_DOMAINS host', () => {
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, LANE_CUSTOM_DOMAINS.length);
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.ok(EXPECTED_WORKER_DOMAIN_BINDINGS.has(row.hostname));
  }
});

test('production hosts accept fremontderby or fremontderby-prod', () => {
  for (const row of LANE_CUSTOM_DOMAINS.filter((r) => r.env === 'production')) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname);
    assert.deepEqual([...allowed], ['fremontderby', 'fremontderby-prod']);
  }
});

test('lane hosts accept only their dedicated service', () => {
  for (const row of LANE_CUSTOM_DOMAINS.filter((r) => r.env !== 'production')) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname);
    assert.deepEqual([...allowed], [row.service]);
  }
});
