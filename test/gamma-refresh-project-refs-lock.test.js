import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_TARGET_SCHEMA,
  GAMMA_STAGING_PROJECT_REF,
  PRODUCTION_PROJECT_REF,
  evaluateGammaRefreshPreflight,
} from '../scripts/gamma-refresh/preflight.mjs';

test('gamma refresh project refs match known dual-project topology', () => {
  assert.equal(PRODUCTION_PROJECT_REF, 'cpiucsxlkicmlbvdvhww');
  assert.equal(GAMMA_STAGING_PROJECT_REF, 'oqkkvqkerusepyokzbmt');
  assert.equal(ALLOWED_TARGET_SCHEMA, 'gamma');
  assert.notEqual(PRODUCTION_PROJECT_REF, GAMMA_STAGING_PROJECT_REF);
});

test('evaluateGammaRefreshPreflight rejects production as write target', () => {
  const result = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: PRODUCTION_PROJECT_REF,
    targetSchema: 'gamma',
  });
  assert.equal(result.ok, false);
});

test('evaluateGammaRefreshPreflight accepts prod → staging gamma schema', () => {
  const result = evaluateGammaRefreshPreflight({
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: GAMMA_STAGING_PROJECT_REF,
    targetSchema: 'gamma',
  });
  assert.equal(result.ok, true);
});
