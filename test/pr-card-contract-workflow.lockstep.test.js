import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = join(root, '.github/workflows/pr-card-contract.yml');
const scriptPath = join(root, 'scripts/check-pr-card-contract.mjs');

test('pr-card-contract workflow file exists', () => {
  assert.ok(existsSync(workflowPath), '.github/workflows/pr-card-contract.yml must exist');
});

test('check-pr-card-contract script exists', () => {
  assert.ok(existsSync(scriptPath), 'scripts/check-pr-card-contract.mjs must exist');
});

test('pr-card-contract workflow runs the pure contract script and names the required check', () => {
  const src = readFileSync(workflowPath, 'utf8');
  assert.ok(src.includes('name: PR card contract'), 'workflow display name');
  assert.ok(src.includes('name: pr-card-contract'), 'job name must be pr-card-contract for branch protection');
  assert.ok(
    src.includes('node scripts/check-pr-card-contract.mjs'),
    'must invoke the pure check-pr-card-contract script',
  );
  assert.ok(src.includes('validateTrackingCardLabels'), 'must re-validate tracking card labels');
  assert.ok(
    src.includes("issue.state !== 'open'") || src.includes('must remain open'),
    'must keep tracking cards open through post-merge verification',
  );
});

test('pr-card-contract is fork-safe (pull_request + read-only permissions)', () => {
  const src = readFileSync(workflowPath, 'utf8');
  assert.ok(src.includes('pull_request:'), 'must use pull_request event');
  assert.ok(!/pull_request_target:/.test(src), 'must not use pull_request_target');
  assert.ok(src.includes('contents: read'), 'contents must be read-only');
  assert.ok(src.includes('pull-requests: read'), 'pull-requests must be read-only');
});
