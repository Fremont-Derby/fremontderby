import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

test('diagnose and restore agree on hostname → Worker service map', () => {
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, WORKER_DOMAIN_BINDINGS.length);
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, 5);
  for (const row of WORKER_DOMAIN_BINDINGS) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname);
    assert.ok(allowed, row.hostname);
    assert.ok(allowed.includes(row.service), `${row.hostname} -> ${row.service}`);
  }
  for (const hostname of EXPECTED_WORKER_DOMAIN_BINDINGS.keys()) {
    assert.ok(
      WORKER_DOMAIN_BINDINGS.some((item) => item.hostname === hostname),
      hostname,
    );
  }
});
