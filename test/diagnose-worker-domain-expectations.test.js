import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

test('diagnose and restore agree on hostname → Worker service map', () => {
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, 5);
  for (const row of WORKER_DOMAIN_BINDINGS) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname);
    assert.ok(allowed, `missing expected binding for ${row.hostname}`);
    const services = Array.isArray(allowed) ? allowed : [allowed];
    assert.ok(services.includes(row.service), `${row.hostname} -> ${row.service}`);
  }
  for (const [hostname, services] of EXPECTED_WORKER_DOMAIN_BINDINGS) {
    const allowed = Array.isArray(services) ? services : [services];
    const row = WORKER_DOMAIN_BINDINGS.find((item) => item.hostname === hostname);
    assert.ok(row, hostname);
    assert.ok(allowed.includes(row.service), `${hostname} -> ${row.service}`);
  }
});
