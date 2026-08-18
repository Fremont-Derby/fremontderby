import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLaneDeployContext } from '../scripts/deploy-lane.mjs';

function fakeSpawn(stdout) {
  return () => ({ status: 0, stdout, error: null });
}

test('assertLaneDeployContext accepts matching permanent branch', () => {
  const cfg = assertLaneDeployContext('dru', { GITHUB_ACTIONS: 'true', GITHUB_REF_NAME: 'fremontderby-dru' }, fakeSpawn(''));
  assert.equal(cfg.branch, 'fremontderby-dru');
  assert.equal(cfg.environment, 'dru');
});

test('assertLaneDeployContext refuses wrong branch', () => {
  assert.throws(
    () =>
      assertLaneDeployContext(
        'dru',
        { GITHUB_ACTIONS: 'true', GITHUB_REF_NAME: 'fremontderby-jfl' },
        fakeSpawn(''),
      ),
    /Refusing dru deploy from branch/,
  );
});

test('assertLaneDeployContext allows main when FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN=1', () => {
  const cfg = assertLaneDeployContext(
    'jfl',
    { FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1' },
    fakeSpawn(''),
  );
  assert.equal(cfg.environment, 'jfl');
});
