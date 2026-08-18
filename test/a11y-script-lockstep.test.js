import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('a11y maps to pa11y-rendered.mjs', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.a11y, 'node scripts/pa11y-rendered.mjs');
});
