import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/public-surface-canary.yml', import.meta.url),
  'utf8',
);

test('public-surface-canary workflow name and scripts', () => {
  assert.match(workflow, /^name:\s*Public surface canary\s*$/m);
  assert.match(workflow, /assert-production-dns\.mjs/);
  assert.match(workflow, /assert-public-surface\.mjs/);
});
