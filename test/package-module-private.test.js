import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('package is ESM', () => {
  assert.equal(pkg.type, 'module');
});

test('package is private', () => {
  assert.equal(pkg.private, true);
});
