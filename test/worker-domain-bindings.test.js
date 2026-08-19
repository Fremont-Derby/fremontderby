import assert from 'node:assert/strict';
import test from 'node:test';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

test('production apex attach target is canonical fremontderby (legacy fremontderby-prod still live-safe elsewhere)', () => {
  const apex = WORKER_DOMAIN_BINDINGS.find((row) => row.hostname === 'fremontderby.com');
  assert.ok(apex);
  assert.equal(apex.service, 'fremontderby');
  assert.equal(
    WORKER_DOMAIN_BINDINGS.some(
      (row) => row.hostname === 'fremontderby.com' && row.service !== 'fremontderby',
    ),
    false,
  );
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
    if (row.hostname.endsWith('.fremontderby.com') && row.hostname !== 'fremontderby.com' && row.hostname !== 'www.fremontderby.com') {
      assert.notEqual(row.service, 'fremontderby-prod');
      assert.notEqual(row.service, 'fremontderby');
    }
  }
});
