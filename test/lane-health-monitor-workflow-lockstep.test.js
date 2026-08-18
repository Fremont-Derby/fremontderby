import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lane-health-monitor runs dns lane health surface and diagnose', () => {
  const yml = readFileSync('.github/workflows/lane-health-monitor.yml', 'utf8');
  assert.match(yml, /cron: '\*\/15 \* \* \* \*'/);
  assert.match(yml, /assert-production-dns\.mjs/);
  assert.match(yml, /assert-lane-health\.mjs/);
  assert.match(yml, /assert-public-surface\.mjs/);
  assert.match(yml, /diagnose-worker-domains\.mjs/);
});
