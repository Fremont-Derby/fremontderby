import test from 'node:test';
import assert from 'node:assert/strict';
import { HTML_SHELL_MARKERS } from '../scripts/public-surface-contract.mjs';

test('HTML_SHELL_MARKERS requires doctype fremont viewport', () => {
  assert.deepEqual([...HTML_SHELL_MARKERS], ['<!doctype html', 'fremont', 'viewport']);
  assert.equal(Object.isFrozen(HTML_SHELL_MARKERS), true);
});
