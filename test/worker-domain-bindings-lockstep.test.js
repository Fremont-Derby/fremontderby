import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';

test('EXPECTED_WORKER_DOMAIN_BINDINGS covers the five public hosts', () => {
  const hosts = [...EXPECTED_WORKER_DOMAIN_BINDINGS.keys()].sort();
  assert.deepEqual(hosts, [
    'dru.fremontderby.com',
    'fremontderby.com',
    'gamma.fremontderby.com',
    'jfl.fremontderby.com',
    'www.fremontderby.com',
  ]);
});

test('apex and www allow fremontderby or fremontderby-prod', () => {
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('fremontderby.com')].sort(), [
    'fremontderby',
    'fremontderby-prod',
  ]);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('www.fremontderby.com')].sort(), [
    'fremontderby',
    'fremontderby-prod',
  ]);
});

test('lane hosts bind only to their Worker services', () => {
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('dru.fremontderby.com')], ['fremontderby-dru']);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('jfl.fremontderby.com')], ['fremontderby-jfl']);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('gamma.fremontderby.com')], ['fremontderby-gamma']);
});
