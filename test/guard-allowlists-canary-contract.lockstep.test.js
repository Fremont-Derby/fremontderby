import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { LANE_BRANCH_ALLOWLISTS, branchAllowedForLane } from '../scripts/guard-cloudflare-build.mjs';
import { laneDeployments } from '../scripts/deploy-lane.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('LANE_BRANCH_ALLOWLISTS covers production + every laneDeployments key', () => {
  const allowlistKeys = Object.keys(LANE_BRANCH_ALLOWLISTS).sort();
  const deployKeys = Object.keys(laneDeployments).sort();
  assert.deepEqual(allowlistKeys, ['dru', 'gamma', 'jfl', 'production'].sort());
  for (const lane of deployKeys) {
    assert.ok(
      LANE_BRANCH_ALLOWLISTS[lane],
      `guard allowlist missing deploy lane ${lane}`,
    );
    assert.equal(branchAllowedForLane(laneDeployments[lane].branch, lane), true);
    assert.equal(branchAllowedForLane(`${lane}/issue-1-x`, lane), true);
    assert.equal(branchAllowedForLane('main', lane), false);
  }
  assert.equal(branchAllowedForLane('main', 'production'), true);
});

test('canary:contract lists existing pure contract tests including host-env coverage', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const cmd = pkg.scripts['canary:contract'] || '';
  assert.ok(cmd.startsWith('node --test '));
  const files = cmd.replace(/^node --test\s+/, '').split(/\s+/).filter(Boolean);
  assert.ok(files.length >= 4, 'canary:contract should cover multiple contract files');
  for (const file of files) {
    assert.ok(existsSync(join(root, file)), `${file} must exist`);
  }
  assert.ok(files.some((f) => f.includes('public-surface-contract')));
  assert.ok(files.some((f) => f.includes('assert-production-dns')));
  assert.ok(files.some((f) => f.includes('host-environment') || f.includes('assert-lane-health')));
});
