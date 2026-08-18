import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('validate-gamma-rc defaults to gamma host and health paths', () => {
  const source = readFileSync('scripts/validate-gamma-rc.mjs', 'utf8');
  assert.match(source, /gamma\.fremontderby\.com/);
  assert.match(source, /\/health\/environment/);
  assert.match(source, /versionTag/);
  assert.match(source, /EXPECTED_VERSION_TAG/);
});
