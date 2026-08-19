import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  WORKER_DOMAIN_BINDINGS,
  allowedServicesFor,
  apexBindingIsSafe,
} from '../scripts/restore-lane-custom-domains.mjs';
import { EXPECTED_WORKER_DOMAIN_BINDINGS } from '../scripts/diagnose-worker-domains.mjs';
import { LANE_CUSTOM_DOMAINS } from '../scripts/lane-custom-domains.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('apex and www allow both canonical fremontderby and legacy fremontderby-prod', () => {
  for (const hostname of ['fremontderby.com', 'www.fremontderby.com']) {
    const row = LANE_CUSTOM_DOMAINS.find((r) => r.hostname === hostname);
    assert.ok(row);
    assert.deepEqual(allowedServicesFor(row), ['fremontderby', 'fremontderby-prod']);
    assert.deepEqual(
      [...EXPECTED_WORKER_DOMAIN_BINDINGS.get(hostname)],
      ['fremontderby', 'fremontderby-prod'],
    );
  }
  assert.equal(apexBindingIsSafe('fremontderby'), true);
  assert.equal(apexBindingIsSafe('fremontderby-prod'), true);
  assert.equal(apexBindingIsSafe('fremontderby-jfl'), false);
  assert.equal(apexBindingIsSafe('fremontderby-gamma'), false);
});

test('LANE_CUSTOM_DOMAINS prefers canonical fremontderby service for apex attach target', () => {
  const apex = LANE_CUSTOM_DOMAINS.find((r) => r.hostname === 'fremontderby.com');
  assert.equal(apex.service, 'fremontderby');
  assert.equal(WORKER_DOMAIN_BINDINGS, LANE_CUSTOM_DOMAINS);
});

test('lane hosts never allow production scripts', () => {
  for (const hostname of ['dru.fremontderby.com', 'jfl.fremontderby.com', 'gamma.fremontderby.com']) {
    const row = LANE_CUSTOM_DOMAINS.find((r) => r.hostname === hostname);
    const allowed = allowedServicesFor(row);
    assert.equal(allowed.length, 1);
    assert.ok(allowed[0].startsWith('fremontderby-'));
    assert.ok(!allowed.includes('fremontderby'));
    assert.ok(!allowed.includes('fremontderby-prod'));
  }
});

test('restore critical-check source uses apexBindingIsSafe (not fremontderby-prod only)', () => {
  const src = readFileSync(join(root, 'scripts/restore-lane-custom-domains.mjs'), 'utf8');
  assert.ok(src.includes('apexBindingIsSafe'));
  assert.ok(!/apex\.service !== 'fremontderby-prod'/.test(src));
});
