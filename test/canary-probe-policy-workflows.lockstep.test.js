import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readWorkflow(name) {
  const path = join(root, '.github/workflows', name);
  assert.ok(existsSync(path), `${name} must exist`);
  return readFileSync(path, 'utf8');
}

test('hourly-live-probe workflow runs production DNS + hourly probe scripts', () => {
  const src = readWorkflow('hourly-live-probe.yml');
  assert.ok(src.includes('name: Hourly live probe'));
  assert.ok(/cron:\s*'5 \* \* \* \*'/.test(src) || src.includes("cron: '5 * * * *'"));
  assert.ok(src.includes('node scripts/assert-production-dns.mjs'));
  assert.ok(src.includes('node scripts/hourly-live-probe.mjs'));
  assert.ok(src.includes('PROBE_HOST: https://fremontderby.com'));
  assert.ok(src.includes('PROBE_WWW: https://www.fremontderby.com'));
  assert.ok(src.includes('PROBE_DRU: https://dru.fremontderby.com'));
  assert.ok(src.includes('PROBE_JFL: https://jfl.fremontderby.com'));
  assert.ok(src.includes('PROBE_GAMMA: https://gamma.fremontderby.com'));
});

test('public-surface-canary workflow runs DNS + public surface asserts', () => {
  const src = readWorkflow('public-surface-canary.yml');
  assert.ok(src.includes('name: Public surface canary'));
  assert.ok(src.includes('node scripts/assert-production-dns.mjs'));
  assert.ok(src.includes('node scripts/assert-public-surface.mjs'));
  assert.ok(src.includes('push:') && src.includes('branches: [main]'));
  assert.ok(src.includes("title = '[CANARY] Public surface or DNS regression'") || src.includes('[CANARY] Public surface'));
});

test('release-source-policy workflow is fork-safe and runs the pure policy script', () => {
  const src = readWorkflow('release-source-policy.yml');
  assert.ok(src.includes('name: Release source policy'));
  assert.ok(src.includes('pull_request:'));
  assert.ok(!/pull_request_target:/.test(src));
  assert.ok(src.includes('contents: read'));
  assert.ok(src.includes('pull-requests: read'));
  assert.ok(src.includes('node scripts/check-release-source-policy.mjs'));
  assert.ok(src.includes("STRICT_RELEASE_SOURCE_POLICY: '1'") || src.includes('STRICT_RELEASE_SOURCE_POLICY'));
});

test('supporting pure scripts for the three workflows exist', () => {
  for (const rel of [
    'scripts/assert-production-dns.mjs',
    'scripts/hourly-live-probe.mjs',
    'scripts/assert-public-surface.mjs',
    'scripts/check-release-source-policy.mjs',
  ]) {
    assert.ok(existsSync(join(root, rel)), `${rel} must exist`);
  }
});
