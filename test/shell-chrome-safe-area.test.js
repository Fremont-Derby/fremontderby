import test from 'node:test';
import assert from 'node:assert/strict';
import { shellStyles } from '../src/appShell.js';

test('sticky shell respects notch safe-area', () => {
  assert.match(shellStyles, /\.fd-shell\s*\{[^}]*padding-top:\s*env\(safe-area-inset-top/s);
});

test('header inner and mobile chrome use horizontal safe-area', () => {
  assert.match(shellStyles, /safe-area-inset-left/);
  assert.match(shellStyles, /safe-area-inset-right/);
  assert.match(shellStyles, /safe-area-inset-bottom/);
});

test('message preview and error popup clear the header under notch', () => {
  assert.match(shellStyles, /\.fd-message-preview[^}]*top:\s*calc\(64px \+ env\(safe-area-inset-top/s);
  assert.match(shellStyles, /\.fd-error-popup[^}]*top:\s*calc\(72px \+ env\(safe-area-inset-top/s);
});

test('error popup close does not use negative hanging margin', () => {
  assert.doesNotMatch(shellStyles, /\.fd-error-popup__close\s*\{[^}]*margin:\s*-/s);
});

test('unread badge stays inset on the indicator', () => {
  assert.match(shellStyles, /\.fd-message-indicator__badge\s*\{[^}]*top:\s*2px/s);
  assert.match(shellStyles, /\.fd-message-indicator__badge\s*\{[^}]*right:\s*2px/s);
});
