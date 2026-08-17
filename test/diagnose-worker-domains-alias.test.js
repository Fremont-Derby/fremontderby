
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';

test('production hostnames accept fremontderby or fremontderby-prod', () => {
  const apex = EXPECTED_WORKER_DOMAIN_BINDINGS.get('fremontderby.com');
  assert.ok(Array.isArray(apex));
  assert.ok(apex.includes('fremontderby'));
  assert.ok(apex.includes('fremontderby-prod'));
});
