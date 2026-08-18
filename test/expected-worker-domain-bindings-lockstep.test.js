import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';

test('EXPECTED_WORKER_DOMAIN_BINDINGS maps hosts to allowed services', () => {
  assert.deepEqual(
    [...EXPECTED_WORKER_DOMAIN_BINDINGS.get('fremontderby.com')],
    ['fremontderby', 'fremontderby-prod'],
  );
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('dru.fremontderby.com')], ['fremontderby-dru']);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('jfl.fremontderby.com')], ['fremontderby-jfl']);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('gamma.fremontderby.com')], ['fremontderby-gamma']);
});
