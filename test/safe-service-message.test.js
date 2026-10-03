import test from 'node:test';
import assert from 'node:assert/strict';
import { safeServiceMessage } from '../src/safeServiceMessage.js';

test('edge HTML is a short profile retry', () => {
  assert.equal(safeServiceMessage(429, '<html>Error 1015</html>'), 'Profile is busy. Wait a moment and try again.');
  assert.equal(safeServiceMessage(401, '<html>denied</html>'), '');
});
