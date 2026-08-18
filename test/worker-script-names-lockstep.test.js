import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScriptNames } from '../scripts/disable-workers-dev.mjs';

test('workerScriptNames is frozen and includes production + lanes', () => {
  assert.equal(Object.isFrozen(workerScriptNames), true);
  assert.ok(workerScriptNames.includes('fremontderby'));
  assert.ok(workerScriptNames.includes('fremontderby-prod'));
  assert.ok(workerScriptNames.includes('fremontderby-jfl'));
  assert.ok(workerScriptNames.includes('fremontderby-dru'));
  assert.ok(workerScriptNames.includes('fremontderby-gamma'));
  assert.ok(workerScriptNames.includes('fremontderby-staging'));
});
