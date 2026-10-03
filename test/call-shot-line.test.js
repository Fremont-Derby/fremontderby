import test from 'node:test';
import assert from 'node:assert/strict';
import { callShotLine } from '../src/callShotLine.js';

test('a scorecard names a called shot', () => {
  assert.equal(callShotLine('8 in the side'), 'Called 8 in the side');
  assert.equal(callShotLine(''), 'Shot not called');
});
