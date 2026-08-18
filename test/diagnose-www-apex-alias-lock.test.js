import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';

test('apex and www accept fremontderby or fremontderby-prod', () => {
  for (const host of ['fremontderby.com', 'www.fremontderby.com']) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(host);
    assert.ok(Array.isArray(allowed), host);
    assert.ok(allowed.includes('fremontderby'), host);
    assert.ok(allowed.includes('fremontderby-prod'), host);
  }
});
