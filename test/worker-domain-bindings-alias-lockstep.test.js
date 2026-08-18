import test from 'node:test';
import assert from 'node:assert/strict';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

test('WORKER_DOMAIN_BINDINGS aliases LANE_CUSTOM_DOMAINS', () => {
  assert.equal(WORKER_DOMAIN_BINDINGS, LANE_CUSTOM_DOMAINS);
  assert.ok(WORKER_DOMAIN_BINDINGS.some((r) => r.hostname === 'fremontderby.com'));
  assert.ok(WORKER_DOMAIN_BINDINGS.some((r) => r.hostname === 'dru.fremontderby.com'));
});
