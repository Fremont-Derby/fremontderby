import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('public-surface-canary runs dns then surface on schedule and main push', () => {
  const yml = readFileSync('.github/workflows/public-surface-canary.yml', 'utf8');
  assert.match(yml, /cron: '10,40 \* \* \* \*'/);
  assert.match(yml, /branches: \[main\]/);
  assert.match(yml, /assert-production-dns\.mjs/);
  assert.match(yml, /assert-public-surface\.mjs/);
});
