import test from 'node:test';
import assert from 'node:assert/strict';
import { testerPath } from '../src/missionPath.js';

test('test drive and fixture preview go to the mission', () => {
  assert.equal(testerPath('/test-drive'), '/mission');
  assert.equal(testerPath('/fixture-preview'), '/mission');
  assert.equal(testerPath('/schedule'), '/schedule');
});
