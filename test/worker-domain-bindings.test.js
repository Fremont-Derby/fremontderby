import assert from 'node:assert/strict';
import test from 'node:test';
import { WORKER_DOMAIN_BINDINGS } from '../scripts/restore-lane-custom-domains.mjs';

test('production apex is bound only to the production Worker script', () => {
  const apex = WORKER_DOMAIN_BINDINGS.find((row) => row.hostname === 'fremontderby.com');
  assert.ok(apex);
  // Canonical root Worker name in wrangler.jsonc / lane-custom-domains.mjs is `fremontderby`.
  // Historical `fremontderby-prod` may still exist in Cloudflare; emergency restore allows both.
  assert.equal(apex.service, 'fremontderby');
  assert.equal(
    WORKER_DOMAIN_BINDINGS.some(
      (row) =>
        row.hostname === 'fremontderby.com' &&
        row.service !== 'fremontderby' &&
        row.service !== 'fremontderby-prod',
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
    if (row.hostname.endsWith('.fremontderby.com') && row.hostname !== 'fremontderby.com') {
      assert.notEqual(row.service, 'fremontderby');
      assert.notEqual(row.service, 'fremontderby-prod');
    }
  }
});
