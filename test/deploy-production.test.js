import test from 'node:test';
import assert from 'node:assert/strict';

import { assertProductionDeployContext } from '../scripts/deploy-production.mjs';

test('Workers Builds production deploy is allowed from main', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
  }));
});

test('Workers Builds production deploy rejects a pull-request branch', () => {
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'feature/example',
    }),
    /Refusing production deploy from non-production branch/,
  );
});

test('Workers Builds production deploy fails closed when branch metadata is missing', () => {
  assert.throws(
    () => assertProductionDeployContext({ WORKERS_CI: '1' }),
    /did not provide WORKERS_CI_BRANCH/,
  );
});

test('local/manual deploys remain allowed outside Workers Builds', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({}));
});
