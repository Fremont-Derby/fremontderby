import test from 'node:test';
import assert from 'node:assert/strict';
import { shellStyles } from '../src/appShell.js';

test('message unread badge sits inside the indicator, not hanging off top-right', () => {
  assert.match(shellStyles, /\.fd-message-indicator__badge\s*\{[^}]*top:\s*2px/s);
  assert.match(shellStyles, /\.fd-message-indicator__badge\s*\{[^}]*right:\s*2px/s);
  assert.doesNotMatch(shellStyles, /\.fd-message-indicator__badge\s*\{[^}]*top:\s*-/s);
  assert.doesNotMatch(shellStyles, /\.fd-message-indicator__badge\s*\{[^}]*right:\s*-/s);
});
