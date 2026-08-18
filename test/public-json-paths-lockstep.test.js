import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_JSON_PATHS } from '../scripts/public-surface-contract.mjs';

test('PUBLIC_JSON_PATHS covers health endpoints only', () => {
  assert.deepEqual([...PUBLIC_JSON_PATHS], ['/health', '/health/environment']);
  assert.equal(Object.isFrozen(PUBLIC_JSON_PATHS), true);
});
