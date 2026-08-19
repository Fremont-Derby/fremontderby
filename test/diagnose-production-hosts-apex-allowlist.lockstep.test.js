import assert from 'node:assert/strict';
import test from 'node:test';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';

test('apex production hosts allowlist includes both fremontderby and fremontderby-prod', () => {
  const apex = EXPECTED_WORKER_DOMAIN_BINDINGS.get('fremontderby.com');
  const www = EXPECTED_WORKER_DOMAIN_BINDINGS.get('www.fremontderby.com');

  assert.ok(Array.isArray(apex), 'fremontderby.com allowlist is array');
  assert.ok(Array.isArray(www), 'www.fremontderby.com allowlist is array');

  assert.ok(apex.includes('fremontderby'), 'apex includes fremontderby');
  assert.ok(apex.includes('fremontderby-prod'), 'apex includes fremontderby-prod');
  assert.ok(www.includes('fremontderby'), 'www includes fremontderby');
  assert.ok(www.includes('fremontderby-prod'), 'www includes fremontderby-prod');

  // Stable order / exact inventory for apex (legacy dual attach)
  assert.deepEqual(apex, Object.freeze(['fremontderby', 'fremontderby-prod']));
  assert.deepEqual(www, Object.freeze(['fremontderby', 'fremontderby-prod']));
});
