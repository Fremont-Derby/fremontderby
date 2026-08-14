import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  WORKER_DOMAIN_BINDINGS,
  restoreWorkerDomains,
} from '../scripts/restore-lane-custom-domains.mjs';

const silentLogger = Object.freeze({
  log() {},
  warn() {},
  error() {},
});

const expectedDomains = WORKER_DOMAIN_BINDINGS.map(({ hostname, service }) => ({ hostname, service }));

test('production apex is bound only to fremontderby-prod', () => {
  const apex = WORKER_DOMAIN_BINDINGS.find((row) => row.hostname === 'fremontderby.com');
  assert.ok(apex);
  assert.equal(apex.service, 'fremontderby-prod');
  assert.equal(
    WORKER_DOMAIN_BINDINGS.some(
      (row) => row.hostname === 'fremontderby.com' && row.service !== 'fremontderby-prod',
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
      assert.notEqual(row.service, 'fremontderby-prod');
    }
  }
});

test('restore refuses all mutation when Cloudflare domain state cannot be listed', async () => {
  let attachCalls = 0;
  await assert.rejects(
    restoreWorkerDomains({
      listDomains: async () => {
        throw new Error('Cloudflare domain listing unavailable');
      },
      attach: async () => {
        attachCalls += 1;
        return { response: { ok: true }, payload: { success: true } };
      },
      logger: silentLogger,
    }),
    /Cloudflare domain listing unavailable/,
  );
  assert.equal(attachCalls, 0);
});

test('restore is a no-op when every binding is already healthy', async () => {
  let attachCalls = 0;
  const result = await restoreWorkerDomains({
    listDomains: async () => expectedDomains,
    attach: async () => {
      attachCalls += 1;
      return { response: { ok: true }, payload: { success: true } };
    },
    logger: silentLogger,
  });

  assert.equal(attachCalls, 0);
  assert.equal(result.results.every((row) => row.status === 'already'), true);
});

test('restore mutates only a binding positively observed as missing', async () => {
  let listCalls = 0;
  const attached = [];
  const missingJfl = expectedDomains.filter((row) => row.hostname !== 'jfl.fremontderby.com');

  await restoreWorkerDomains({
    listDomains: async () => {
      listCalls += 1;
      return listCalls === 1 ? missingJfl : expectedDomains;
    },
    attach: async (lane) => {
      attached.push(lane.hostname);
      return { response: { ok: true }, payload: { success: true } };
    },
    logger: silentLogger,
  });

  assert.deepEqual(attached, ['jfl.fremontderby.com']);
});

test('custom-domain repair workflow is manual break-glass only', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/restore-lane-custom-domains.yml', import.meta.url),
    'utf8',
  );

  assert.match(workflow, /^\s{2}workflow_dispatch:/m);
  assert.match(workflow, /^\s{6}confirm:/m);
  assert.doesNotMatch(workflow, /^\s{2}schedule:/m);
  assert.doesNotMatch(workflow, /^\s{2}push:/m);
  assert.match(workflow, /cancel-in-progress: false/);
});
