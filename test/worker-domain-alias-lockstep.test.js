import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

test('WORKER_DOMAIN_BINDINGS is the same reference as LANE_CUSTOM_DOMAINS', () => {
  assert.equal(WORKER_DOMAIN_BINDINGS, LANE_CUSTOM_DOMAINS);
});

test('WORKER_DOMAIN_BINDINGS length and first hostname stable', () => {
  assert.equal(WORKER_DOMAIN_BINDINGS.length, 5);
  assert.equal(WORKER_DOMAIN_BINDINGS[0].hostname, 'fremontderby.com');
});
