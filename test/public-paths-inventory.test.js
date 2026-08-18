import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUBLIC_HTML_PATHS,
  PUBLIC_JSON_PATHS,
  HTML_SHELL_MARKERS,
} from '../scripts/public-surface-contract.mjs';

test('public path inventories are non-empty and unique', () => {
  assert.ok(PUBLIC_HTML_PATHS.length > 0);
  assert.ok(PUBLIC_JSON_PATHS.length > 0);
  assert.equal(PUBLIC_HTML_PATHS.length, new Set(PUBLIC_HTML_PATHS).size);
  assert.equal(PUBLIC_JSON_PATHS.length, new Set(PUBLIC_JSON_PATHS).size);
});

test('JSON inventory includes health endpoints', () => {
  assert.ok(PUBLIC_JSON_PATHS.includes('/health'));
  assert.ok(PUBLIC_JSON_PATHS.includes('/health/environment'));
});

test('HTML inventory includes apex and shell markers are non-empty', () => {
  assert.ok(PUBLIC_HTML_PATHS.includes('/'));
  assert.ok(HTML_SHELL_MARKERS.length > 0);
  assert.equal(HTML_SHELL_MARKERS.length, new Set(HTML_SHELL_MARKERS).size);
});
