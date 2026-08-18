import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_TEST_FILES, countTestFiles, assertTestFileFloor } from '../scripts/count-tests.mjs';

test('MIN_TEST_FILES floor is at least 180', () => {
  assert.equal(MIN_TEST_FILES, 180);
});

test('countTestFiles returns current test directory size above floor', async () => {
  const files = await countTestFiles('test');
  assert.ok(files >= MIN_TEST_FILES, `expected >= ${MIN_TEST_FILES}, got ${files}`);
});

test('assertTestFileFloor reports ok for live tree', async () => {
  const result = await assertTestFileFloor('test');
  assert.equal(result.ok, true);
  assert.equal(result.min, MIN_TEST_FILES);
  assert.ok(result.files >= result.min);
});
