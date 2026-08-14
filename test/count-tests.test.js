import assert from 'node:assert/strict';
import test from 'node:test';
import { MIN_TEST_FILES, assertTestFileFloor, countTestFiles } from '../scripts/count-tests.mjs';

test('repository keeps a high test-file floor for season-1 confidence', async () => {
  const files = await countTestFiles();
  assert.ok(files >= MIN_TEST_FILES, `expected >= ${MIN_TEST_FILES} test files, found ${files}`);
  const result = await assertTestFileFloor();
  assert.equal(result.ok, true);
  assert.equal(result.files, files);
});
