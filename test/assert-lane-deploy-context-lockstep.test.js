import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLaneDeployContext } from '../scripts/deploy-lane.mjs';

test('assertLaneDeployContext allows main when override set', () => {
  const cfg = assertLaneDeployContext('dru', { FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1' });
  assert.equal(cfg.environment, 'dru');
});

test('assertLaneDeployContext requires matching permanent branch', () => {
  assert.throws(
    () =>
      assertLaneDeployContext('jfl', {
        GITHUB_ACTIONS: 'true',
        GITHUB_REF_NAME: 'main',
      }),
    /Refusing jfl deploy from branch "main"/,
  );
  const ok = assertLaneDeployContext('jfl', {
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'fremontderby-jfl',
  });
  assert.equal(ok.branch, 'fremontderby-jfl');
});

test('assertLaneDeployContext rejects unknown lanes', () => {
  assert.throws(() => assertLaneDeployContext('staging'), /Unknown release lane/);
});
