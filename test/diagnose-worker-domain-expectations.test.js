import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

function allowedServices(value) {
  return Array.isArray(value) ? value : [value];
}

test('diagnose and restore agree on hostname → Worker service map', () => {
  // Apex + www + three lanes
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, 5);
  assert.equal(WORKER_DOMAIN_BINDINGS.length, 5);

  for (const row of WORKER_DOMAIN_BINDINGS) {
    const expected = EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname);
    assert.ok(expected, `diagnose must know ${row.hostname}`);
    assert.ok(
      allowedServices(expected).includes(row.service),
      `${row.hostname}: restore service ${row.service} must be in diagnose allowlist`,
    );
  }

  for (const [hostname, services] of EXPECTED_WORKER_DOMAIN_BINDINGS) {
    const row = WORKER_DOMAIN_BINDINGS.find((item) => item.hostname === hostname);
    assert.ok(row, hostname);
    assert.ok(
      allowedServices(services).includes(row.service),
      `${hostname}: diagnose allowlist must include restore service ${row.service}`,
    );
  }
});
