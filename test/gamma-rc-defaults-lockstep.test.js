import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('validate-gamma-rc defaults to gamma.fremontderby.com', () => {
  const source = readFileSync('scripts/validate-gamma-rc.mjs', 'utf8');
  assert.match(source, /const defaultBaseUrl = 'https:\/\/gamma\.fremontderby\.com'/);
  assert.match(source, /environment !== 'gamma'/);
});

test('package validate:gamma-rc points at validate-gamma-rc.mjs', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['validate:gamma-rc'], 'node scripts/validate-gamma-rc.mjs');
});
