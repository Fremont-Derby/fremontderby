import test from 'node:test';
import assert from 'node:assert/strict';
import { messagesThemeStyles } from '../src/messagesTheme.js';

test('desktop messages list can scroll with the wheel', () => {
  assert.match(messagesThemeStyles, /\.message-list \{[\s\S]*overflow-y: auto;/);
  assert.match(messagesThemeStyles, /overscroll-behavior: contain/);
});
