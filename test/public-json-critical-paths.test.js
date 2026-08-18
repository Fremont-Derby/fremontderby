import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_JSON_PATHS } from '../scripts/public-surface-contract.mjs';

test('PUBLIC_JSON_PATHS includes critical health endpoints', () => {
  assert.ok(PUBLIC_JSON_PATHS.includes('/health'));
  assert.ok(PUBLIC_JSON_PATHS.includes('/health/environment'));
});

test('PUBLIC_JSON_PATHS entries are absolute path strings', () => {
  for (const path of PUBLIC_JSON_PATHS) {
    assert.match(path, /^\//);
  }
});
