import test from 'node:test';
import assert from 'node:assert/strict';
import { safeError } from '../src/safeError.js';

test('a permission error names the next action and hides internals', () => {
  const text = safeError({ kind: 'permission', reference: 'E-12' }).text;
  assert.match(text, /Open Profile/);
  assert.doesNotMatch(text, /stack|sql|token/i);
});

test('a stale page says to refresh', () => {
  assert.match(safeError({ kind: 'stale' }).text, /Refresh/);
});

test('an unexpected failure keeps a reference and a recovery', () => {
  const text = safeError({ kind: 'server', reference: 'E-9' }).text;
  assert.match(text, /E-9/);
  assert.match(text, /Try again/);
});
