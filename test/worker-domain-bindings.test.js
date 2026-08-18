import assert from 'node:assert/strict';
import test from 'node:test';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

test('production apex is bound to the production Worker name', () => {
  const apex = WORKER_DOMAIN_BINDINGS.find((row) => row.hostname === 'fremontderby.com');
  assert.ok(apex);
  assert.equal(apex.service, 'fremontderby');
  assert.equal(apex.env, 'production');
});

test('lane hostnames map to dedicated Workers never to production script', () => {
  const expected = {
    'dru.fremontderby.com': 'fremontderby-dru',
    'jfl.fremontderby.com': 'fremontderby-jfl',
    'gamma.fremontderby.com': 'fremontderby-gamma',
  };
  for (const [hostname, service] of Object.entries(expected)) {
    const row = WORKER_DOMAIN_BINDINGS.find((item) => item.hostname === hostname);
    assert.ok(row, hostname);
    assert.equal(row.service, service);
  }
  for (const row of WORKER_DOMAIN_BINDINGS) {
    if (row.hostname.endsWith('.fremontderby.com') && row.hostname !== 'www.fremontderby.com') {
      assert.notEqual(row.service, 'fremontderby-prod');
    }
  }
});
