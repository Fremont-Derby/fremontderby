import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('deploy-release-lanes is workflow_dispatch only', () => {
  const yml = readFileSync('.github/workflows/deploy-release-lanes.yml', 'utf8');
  assert.match(yml, /workflow_dispatch:/);
  assert.doesNotMatch(yml, /pull_request:/);
  assert.doesNotMatch(yml, /\bpush:\s*$/m);
});

test('deploy-release-lanes trusted ref gate includes permanent branches', () => {
  const yml = readFileSync('.github/workflows/deploy-release-lanes.yml', 'utf8');
  assert.match(yml, /Trusted ref gate/);
  assert.match(yml, /fremontderby-gamma/);
  assert.match(yml, /fremontderby-jfl/);
  assert.match(yml, /fremontderby-dru/);
  assert.match(yml, /FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN/);
});
