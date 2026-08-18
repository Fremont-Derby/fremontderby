import test from 'node:test';
import assert from 'node:assert/strict';
import { HTML_SHELL_MARKERS } from '../scripts/public-surface-contract.mjs';
import { htmlShellOk } from '../scripts/assert-public-surface.mjs';

test('HTML_SHELL_MARKERS is frozen core set', () => {
  assert.equal(Object.isFrozen(HTML_SHELL_MARKERS), true);
  assert.deepEqual([...HTML_SHELL_MARKERS], ['<!doctype html', 'fremont', 'viewport']);
});

test('htmlShellOk accepts minimal healthy shell', () => {
  const html = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"><title>Fremont Derby</title></head><body></body></html>';
  assert.equal(htmlShellOk(html), true);
});

test('htmlShellOk rejects missing markers', () => {
  assert.equal(htmlShellOk('<html><body>no doctype</body></html>'), false);
  assert.equal(htmlShellOk('<!doctype html><html><body></body></html>'), false);
});
