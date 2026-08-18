import test from 'node:test';
import assert from 'node:assert/strict';
import { assertProductionDeployContext } from '../scripts/deploy-production.mjs';

test('assertProductionDeployContext is no-op outside WORKERS_CI', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({}));
});

test('assertProductionDeployContext refuses non-main under WORKERS_CI', () => {
  assert.throws(
    () =>
      assertProductionDeployContext({
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: 'feature/x',
        WORKERS_CI_COMMIT_SHA: 'a'.repeat(40),
      }),
    /non-production branch/,
  );
});

test('assertProductionDeployContext requires full commit SHA', () => {
  assert.throws(
    () =>
      assertProductionDeployContext({
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: 'main',
        WORKERS_CI_COMMIT_SHA: 'abc1234',
      }),
    /not a full Git SHA/,
  );
});
