import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

test('diagnose and restore agree on hostname → Worker service map', () => {
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, WORKER_DOMAIN_BINDINGS.length);
  for (const row of WORKER_DOMAIN_BINDINGS) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname);
    assert.ok(Array.isArray(allowed), row.hostname);
    assert.equal(allowed.includes(row.service), true);
  }
  for (const hostname of EXPECTED_WORKER_DOMAIN_BINDINGS.keys()) {
    assert.ok(WORKER_DOMAIN_BINDINGS.some((item) => item.hostname === hostname), hostname);
  }
});
