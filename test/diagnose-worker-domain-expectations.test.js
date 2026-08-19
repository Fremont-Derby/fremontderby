import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('diagnose and restore cover the same hostnames', () => {
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, LANE_CUSTOM_DOMAINS.length);
  assert.equal(EXPECTED_WORKER_DOMAIN_BINDINGS.size, WORKER_DOMAIN_BINDINGS.length);
  for (const row of WORKER_DOMAIN_BINDINGS) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(row.hostname);
    assert.ok(allowed, row.hostname);
    assert.ok(
      allowed.includes(row.service),
      `${row.hostname} restore service ${row.service} must be in diagnose allowlist`,
    );
  }
});

test('apex diagnose allowlist accepts canonical and legacy production scripts', () => {
  for (const hostname of ['fremontderby.com', 'www.fremontderby.com']) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(hostname);
    assert.ok(allowed.includes('fremontderby'));
    assert.ok(allowed.includes('fremontderby-prod'));
  }
});
