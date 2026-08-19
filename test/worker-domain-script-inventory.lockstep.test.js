import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { workerScriptNames } from '../scripts/disable-workers-dev.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('EXPECTED_WORKER_DOMAIN_BINDINGS covers every public host', () => {
  const hosts = [...EXPECTED_WORKER_DOMAIN_BINDINGS.keys()].sort();
  assert.deepEqual(hosts, [
    'dru.fremontderby.com',
    'fremontderby.com',
    'gamma.fremontderby.com',
    'jfl.fremontderby.com',
    'www.fremontderby.com',
  ].sort());
});

test('apex and www accept either fremontderby or fremontderby-prod', () => {
  for (const host of ['fremontderby.com', 'www.fremontderby.com']) {
    const allowed = EXPECTED_WORKER_DOMAIN_BINDINGS.get(host);
    assert.ok(allowed.includes('fremontderby'));
    assert.ok(allowed.includes('fremontderby-prod'));
  }
});

test('lane hosts bind only their dedicated Worker scripts', () => {
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('dru.fremontderby.com')], ['fremontderby-dru']);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('jfl.fremontderby.com')], ['fremontderby-jfl']);
  assert.deepEqual([...EXPECTED_WORKER_DOMAIN_BINDINGS.get('gamma.fremontderby.com')], ['fremontderby-gamma']);
});

test('workerScriptNames inventory includes every binding target plus staging', () => {
  assert.deepEqual([...workerScriptNames], [
    'fremontderby',
    'fremontderby-prod',
    'fremontderby-staging',
    'fremontderby-jfl',
    'fremontderby-dru',
    'fremontderby-gamma',
  ]);
  for (const services of EXPECTED_WORKER_DOMAIN_BINDINGS.values()) {
    for (const service of services) {
      assert.ok(
        workerScriptNames.includes(service),
        `${service} must be in workerScriptNames so workers.dev cleanup covers it`,
      );
    }
  }
});

test('EXPECTED_WORKER_DOMAIN_BINDINGS hosts match LANE_CUSTOM_DOMAINS and host-env map', () => {
  const domainHosts = new Set(LANE_CUSTOM_DOMAINS.map((r) => r.hostname));
  for (const hostname of EXPECTED_WORKER_DOMAIN_BINDINGS.keys()) {
    assert.ok(domainHosts.has(hostname), `${hostname} must be in LANE_CUSTOM_DOMAINS`);
    assert.ok(
      HOST_ENVIRONMENT_EXPECTATIONS[hostname],
      `${hostname} must be in HOST_ENVIRONMENT_EXPECTATIONS`,
    );
  }
  for (const row of LANE_CUSTOM_DOMAINS) {
    assert.ok(
      EXPECTED_WORKER_DOMAIN_BINDINGS.has(row.hostname),
      `${row.hostname} must be in EXPECTED_WORKER_DOMAIN_BINDINGS`,
    );
  }
});
