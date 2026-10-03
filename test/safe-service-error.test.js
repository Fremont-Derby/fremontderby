import test from 'node:test';
import assert from 'node:assert/strict';
import { safeServiceMessage } from '../src/safeServiceError.js';

test('profile recovery hides edge HTML and keeps auth distinct', () => {
  assert.equal(safeServiceMessage(429, '<html>error code: 1015</html>'), 'Profile is busy. Wait a moment and try again.');
  assert.equal(safeServiceMessage(500, '<!doctype html><html>cloudflare</html>'), 'Profile is busy. Wait a moment and try again.');
  assert.equal(safeServiceMessage(401, '<html>denied</html>'), 'Sign in again to continue.');
  assert.equal(safeServiceMessage(403, 'forbidden'), 'Sign in again to continue.');
  assert.equal(safeServiceMessage(500, 'nope'), 'Profile could not be loaded. Try again.');
});
