import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('package identity is private ESM Apache-2.0', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.name, 'fremontderby');
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.license, 'Apache-2.0');
});

test('core scripts remain node --test and lint/check', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal(pkg.scripts.lint, 'node scripts/lint.mjs');
  assert.equal(pkg.scripts.check, 'node scripts/check-js-syntax.mjs');
});
