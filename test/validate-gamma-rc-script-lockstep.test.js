import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('validate:gamma-rc maps to validate-gamma-rc.mjs', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['validate:gamma-rc'], 'node scripts/validate-gamma-rc.mjs');
});
