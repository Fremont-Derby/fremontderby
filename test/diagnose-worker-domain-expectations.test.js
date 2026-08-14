import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

test('diagnose and restore agree on hostname → Worker service map', () => {
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, 4);
  for (const row of WORKER_DOMAIN_BINDINGS) {
    assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname), row.service);
  }
  for (const [hostname, service] of EXPECTED_WORKER_DOMAIN_BINDINGS) {
    const row = WORKER_DOMAIN_BINDINGS.find((item) => item.hostname === hostname);
    assert.ok(row, hostname);
    assert.equal(row.service, service);
  }
});
