import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPECTED_WORKER_DOMAIN_BINDINGS,
  evaluateDomainBindings,
} from '../scripts/diagnose-worker-domains.mjs';

test('EXPECTED_WORKER_DOMAIN_BINDINGS covers apex aliases and every lane host', () => {
  assert.deepEqual(
    [...EXPECTED_WORKER_DOMAIN_BINDINGS.get('fremontderby.com')],
    ['fremontderby', 'fremontderby-prod'],
  );
  assert.deepEqual(
    [...EXPECTED_WORKER_DOMAIN_BINDINGS.get('www.fremontderby.com')],
    ['fremontderby', 'fremontderby-prod'],
  );
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('dru.fremontderby.com')], ['fremontderby-dru']);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('jfl.fremontderby.com')], ['fremontderby-jfl']);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('gamma.fremontderby.com')], ['fremontderby-gamma']);
});

test('evaluateDomainBindings reports ok for correct live rows', () => {
  const domains = [
    { hostname: 'fremontderby.com', service: 'fremontderby' },
    { hostname: 'www.fremontderby.com', service: 'fremontderby-prod' },
    { hostname: 'dru.fremontderby.com', service: 'fremontderby-dru' },
    { hostname: 'jfl.fremontderby.com', service: 'fremontderby-jfl' },
    { hostname: 'gamma.fremontderby.com', service: 'fremontderby-gamma' },
  ];
  const { failed, findings } = evaluateDomainBindings(domains);
  assert.equal(failed, 0);
  assert.equal(findings.every((f) => f.status === 'ok'), true);
});

test('evaluateDomainBindings fails closed on missing and misrouted hosts', () => {
  const domains = [
    { hostname: 'fremontderby.com', service: 'fremontderby-jfl' },
    { hostname: 'dru.fremontderby.com', service: 'fremontderby-dru' },
  ];
  const { failed, findings } = evaluateDomainBindings(domains);
  assert.ok(failed >= 3);
  assert.ok(findings.some((f) => f.hostname === 'fremontderby.com' && f.status === 'misroute'));
  assert.ok(findings.some((f) => f.hostname === 'jfl.fremontderby.com' && f.status === 'missing'));
  assert.ok(findings.some((f) => f.hostname === 'gamma.fremontderby.com' && f.status === 'missing'));
  assert.ok(findings.some((f) => f.hostname === 'dru.fremontderby.com' && f.status === 'ok'));
});

test('evaluateDomainBindings never treats a lane host as production-safe', () => {
  const domains = [
    { hostname: 'jfl.fremontderby.com', service: 'fremontderby' },
    { hostname: 'dru.fremontderby.com', service: 'fremontderby-prod' },
    { hostname: 'gamma.fremontderby.com', service: 'fremontderby-gamma' },
  ];
  const { findings } = evaluateDomainBindings(domains);
  assert.equal(
    findings.find((f) => f.hostname === 'jfl.fremontderby.com').status,
    'misroute',
  );
  assert.equal(
    findings.find((f) => f.hostname === 'dru.fremontderby.com').status,
    'misroute',
  );
  assert.equal(
    findings.find((f) => f.hostname === 'gamma.fremontderby.com').status,
    'ok',
  );
});
