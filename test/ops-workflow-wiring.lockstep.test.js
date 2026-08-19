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

test('sync-collaboration-labels workflow validates then syncs the manifest', () => {
  const src = readWorkflow('sync-collaboration-labels.yml');
  assert.ok(src.includes('name: Sync collaboration labels'));
  assert.ok(src.includes('workflow_dispatch:'));
  assert.ok(src.includes('npm run labels:check') || src.includes('labels:check'));
  assert.ok(src.includes('node scripts/collaboration-labels.mjs --sync'));
});

test('diagnose-worker-domains workflow invokes the pure diagnose script', () => {
  const src = readWorkflow('diagnose-worker-domains.yml');
  assert.ok(src.includes('name: Diagnose worker domains'));
  assert.ok(src.includes('workflow_dispatch:'));
  assert.ok(src.includes('node scripts/diagnose-worker-domains.mjs'));
});

test('lane-health-monitor runs DNS + lane health + public surface (+ optional diagnose)', () => {
  const src = readWorkflow('lane-health-monitor.yml');
  assert.ok(src.includes('name: Lane health monitor'));
  assert.ok(src.includes("cron: '*/15 * * * *'") || /cron:\s*'\*\/15/.test(src));
  assert.ok(src.includes('node scripts/assert-production-dns.mjs'));
  assert.ok(src.includes('node scripts/assert-lane-health.mjs'));
  assert.ok(src.includes('node scripts/assert-public-surface.mjs'));
  assert.ok(src.includes('node scripts/diagnose-worker-domains.mjs'));
});

test('deploy-release-lanes is workflow_dispatch-only with trusted-ref gate', () => {
  const src = readWorkflow('deploy-release-lanes.yml');
  assert.ok(src.includes('name: Deploy release lanes'));
  assert.ok(src.includes('workflow_dispatch:'));
  assert.ok(!/pull_request:/.test(src), 'must not trigger on pull_request');
  assert.ok(src.includes('Trusted ref gate') || src.includes('trusted deploy source'));
  assert.ok(src.includes('fremontderby-gamma'));
  assert.ok(src.includes('fremontderby-jfl'));
  assert.ok(src.includes('fremontderby-dru'));
  assert.ok(src.includes("FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1'") || src.includes('FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN'));
  assert.ok(src.includes('npm run deploy:') || src.includes('deploy:${{ matrix.lane }}'));
});

test('supporting scripts for these ops workflows exist', () => {
  for (const rel of [
    'scripts/collaboration-labels.mjs',
    'scripts/diagnose-worker-domains.mjs',
    'scripts/assert-lane-health.mjs',
    'scripts/assert-public-surface.mjs',
    'scripts/assert-production-dns.mjs',
  ]) {
    assert.ok(existsSync(join(root, rel)), `${rel} must exist`);
  }
});
