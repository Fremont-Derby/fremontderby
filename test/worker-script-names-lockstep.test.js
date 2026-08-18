import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScriptNames } from '../scripts/disable-workers-dev.mjs';

test('workerScriptNames covers production lanes and staging', () => {
  assert.equal(Object.isFrozen(workerScriptNames), true);
  for (const name of [
    'fremontderby',
    'fremontderby-prod',
    'fremontderby-staging',
    'fremontderby-jfl',
    'fremontderby-dru',
    'fremontderby-gamma',
  ]) {
    assert.ok(workerScriptNames.includes(name), name);
  }
});
