import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('production-smoke job is main push only with dedicated concurrency', () => {
  const yml = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(yml, /production-smoke:/);
  assert.match(yml, /group: production-smoke-main/);
  assert.match(yml, /cancel-in-progress: false/);
  assert.match(yml, /github\.ref == 'refs\/heads\/main'/);
});

test('production-smoke invokes smoke-release against production', () => {
  const yml = readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.match(yml, /smoke-release\.mjs https:\/\/fremontderby\.com production/);
});
